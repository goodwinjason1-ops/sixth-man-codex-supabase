type EnvReader = (name: string) => string | undefined;
type Fetcher = typeof fetch;

type HandlerDeps = {
  env?: EnvReader;
  fetch?: Fetcher;
};

const DEFAULT_MODEL = "openai/whisper-large-v3-turbo";
const DEFAULT_MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 60_000;

const jsonHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json"
});

const jsonResponse = (
  body: Record<string, unknown>,
  init: ResponseInit = {},
  origin: string | null = null
) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...jsonHeaders(origin),
      ...(init.headers || {})
    }
  });

const getBearerToken = (request: Request) => {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

const readNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseContextDuration = (formData: FormData) => {
  const durationField = formData.get("durationMs");
  if (typeof durationField === "string" && Number.isFinite(Number(durationField))) {
    return Math.max(0, Math.round(Number(durationField)));
  }

  const contextField = formData.get("context");
  if (typeof contextField !== "string" || !contextField.trim()) return undefined;

  try {
    const context = JSON.parse(contextField);
    const value = context?.durationMs ?? context?.duration_ms;
    return Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : undefined;
  } catch {
    return undefined;
  }
};

const normaliseTranscript = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return "";
  const result = payload as Record<string, unknown>;
  const candidate = result.text ?? result.transcript ?? result.transcription ?? result.generated_text;
  return typeof candidate === "string" ? candidate.trim() : "";
};

const normaliseLanguage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return undefined;
  const result = payload as Record<string, unknown>;
  const candidate = result.language ?? result.detected_language;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : undefined;
};

const normaliseDurationMs = (payload: unknown, fallback?: number) => {
  if (!payload || typeof payload !== "object") return fallback;
  const result = payload as Record<string, unknown>;
  const durationMs = result.durationMs ?? result.duration_ms;
  if (Number.isFinite(Number(durationMs))) return Math.max(0, Math.round(Number(durationMs)));

  const durationSeconds = result.duration ?? result.duration_seconds;
  if (Number.isFinite(Number(durationSeconds))) {
    return Math.max(0, Math.round(Number(durationSeconds) * 1000));
  }

  return fallback;
};

const normaliseConfidence = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return undefined;
  const result = payload as Record<string, unknown>;
  const confidence = result.confidence ?? result.score;
  return Number.isFinite(Number(confidence)) ? Number(confidence) : undefined;
};

const resolveSupabaseUser = async ({
  fetcher,
  supabaseUrl,
  anonKey,
  token
}: {
  fetcher: Fetcher;
  supabaseUrl: string;
  anonKey: string;
  token: string;
}) => {
  const response = await fetcher(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey
    }
  });

  if (!response.ok) return null;
  const user = await response.json().catch(() => null);
  return user?.id ? user : null;
};

export const createHandler = (deps: HandlerDeps = {}) => {
  const env = deps.env || ((name: string) => Deno.env.get(name));
  const fetcher = deps.fetch || fetch;

  return async (request: Request) => {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: jsonHeaders(origin) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, { status: 405 }, origin);
    }

    const token = getBearerToken(request);
    if (!token) {
      return jsonResponse({ error: "Missing Supabase bearer token." }, { status: 401 }, origin);
    }

    const supabaseUrl = env("SUPABASE_URL");
    const anonKey = env("SUPABASE_ANON_KEY");
    const hfToken = env("HF_TOKEN");
    const model = env("HF_ASR_MODEL") || DEFAULT_MODEL;
    const maxAudioBytes = readNumber(env("MAX_AUDIO_BYTES"), DEFAULT_MAX_AUDIO_BYTES);
    const timeoutMs = readNumber(env("HF_TIMEOUT_MS"), DEFAULT_TIMEOUT_MS);

    if (!supabaseUrl || !anonKey) {
      return jsonResponse({ error: "Supabase Auth verification is not configured." }, { status: 500 }, origin);
    }

    if (!hfToken) {
      return jsonResponse({ error: "Speech-to-text provider is not configured." }, { status: 500 }, origin);
    }

    const user = await resolveSupabaseUser({ fetcher, supabaseUrl, anonKey, token });
    if (!user) {
      return jsonResponse({ error: "Invalid or expired Supabase bearer token." }, { status: 401 }, origin);
    }

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return jsonResponse({ error: "Expected multipart/form-data with an audio field." }, { status: 415 }, origin);
    }

    const contentLength = Number(request.headers.get("Content-Length") || "0");
    if (contentLength > maxAudioBytes + 64 * 1024) {
      return jsonResponse({ error: "Voice notes must be 25 MB or smaller." }, { status: 413 }, origin);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonResponse({ error: "Unable to read multipart form data." }, { status: 400 }, origin);
    }

    const audio = formData.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return jsonResponse({ error: "Upload a non-empty audio file in the audio field." }, { status: 400 }, origin);
    }

    if (audio.size > maxAudioBytes) {
      return jsonResponse({ error: "Voice notes must be 25 MB or smaller." }, { status: 413 }, origin);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const fallbackDurationMs = parseContextDuration(formData);

    try {
      const hfEndpoint =
        env("HF_ASR_ENDPOINT") ||
        `https://router.huggingface.co/hf-inference/models/${model}`;

      const providerResponse = await fetcher(hfEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": audio.type || "application/octet-stream",
          "X-Wait-For-Model": "true"
        },
        body: await audio.arrayBuffer(),
        signal: controller.signal
      });

      if (!providerResponse.ok) {
        const detail = await providerResponse.text().catch(() => "");
        console.error("Hugging Face ASR failed", {
          status: providerResponse.status,
          userId: user.id,
          model,
          detail: detail.slice(0, 500)
        });
        return jsonResponse({ error: "Speech-to-text provider failed." }, { status: 502 }, origin);
      }

      const payload = await providerResponse.json();
      const transcript = normaliseTranscript(payload);

      if (!transcript) {
        return jsonResponse({ error: "Speech-to-text provider returned an empty transcript." }, { status: 502 }, origin);
      }

      return jsonResponse(
        {
          transcript,
          language: normaliseLanguage(payload),
          durationMs: normaliseDurationMs(payload, fallbackDurationMs),
          provider: "huggingface",
          model,
          confidence: normaliseConfidence(payload)
        },
        { status: 200 },
        origin
      );
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      return jsonResponse(
        { error: isAbort ? "Speech-to-text provider timed out." : "Unable to transcribe audio." },
        { status: isAbort ? 504 : 500 },
        origin
      );
    } finally {
      clearTimeout(timeout);
    }
  };
};

if (import.meta.main) {
  Deno.serve(createHandler());
}
