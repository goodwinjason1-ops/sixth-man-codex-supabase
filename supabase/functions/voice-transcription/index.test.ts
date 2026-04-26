import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler } from "./index.ts";

const env = (overrides: Record<string, string> = {}) => (name: string) =>
  ({
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    HF_TOKEN: "hf-test-token",
    HF_ASR_MODEL: "test/whisper",
    HF_ASR_ENDPOINT: "https://hf.test/asr",
    ...overrides
  })[name];

const multipartRequest = (token = "valid-token") => {
  const formData = new FormData();
  formData.append("audio", new File([new Uint8Array([1, 2, 3])], "note.webm", { type: "audio/webm" }));
  formData.append("context", JSON.stringify({ durationMs: 1234 }));

  return new Request("http://localhost/voice-transcription", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
};

const headerValue = (headers: HeadersInit | undefined, name: string) =>
  new Headers(headers).get(name);

Deno.test("voice-transcription returns normalized provider transcript", async () => {
  const calls: string[] = [];
  const handler = createHandler({
    env: env(),
    fetch: async (input, init) => {
      const url = String(input);
      calls.push(url);

      if (url.endsWith("/auth/v1/user")) {
        assertEquals(headerValue(init?.headers, "Authorization"), "Bearer valid-token");
        return Response.json({ id: "user-123" });
      }

      assertEquals(url, "https://hf.test/asr");
      assertEquals(headerValue(init?.headers, "Authorization"), "Bearer hf-test-token");
      return Response.json({ text: " Ava defense four. ", language: "en" });
    }
  });

  const response = await handler(multipartRequest());
  const payload = await response.json();

  assertEquals(response.status, 200);
  assertEquals(calls, ["https://example.supabase.co/auth/v1/user", "https://hf.test/asr"]);
  assertEquals(payload, {
    transcript: "Ava defense four.",
    language: "en",
    durationMs: 1234,
    provider: "huggingface",
    model: "test/whisper"
  });
});

Deno.test("voice-transcription uses the current Hugging Face router endpoint by default", async () => {
  const calls: string[] = [];
  const handler = createHandler({
    env: env({ HF_ASR_ENDPOINT: "" }),
    fetch: async (input) => {
      const url = String(input);
      calls.push(url);

      if (url.endsWith("/auth/v1/user")) return Response.json({ id: "user-123" });
      return Response.json({ text: "Mia teamwork five." });
    }
  });

  const response = await handler(multipartRequest());

  assertEquals(response.status, 200);
  assertEquals(calls, [
    "https://example.supabase.co/auth/v1/user",
    "https://router.huggingface.co/hf-inference/models/test/whisper"
  ]);
});

Deno.test("voice-transcription rejects missing bearer token", async () => {
  const handler = createHandler({ env: env() });
  const formData = new FormData();
  formData.append("audio", new File([new Uint8Array([1])], "note.webm"));

  const response = await handler(new Request("http://localhost/voice-transcription", {
    method: "POST",
    body: formData
  }));

  assertEquals(response.status, 401);
});

Deno.test("voice-transcription fails closed when provider token is absent", async () => {
  const handler = createHandler({
    env: env({ HF_TOKEN: "" }),
    fetch: async () => Response.json({ id: "user-123" })
  });

  const response = await handler(multipartRequest());

  assertEquals(response.status, 500);
  assertEquals((await response.json()).error, "Speech-to-text provider is not configured.");
});
