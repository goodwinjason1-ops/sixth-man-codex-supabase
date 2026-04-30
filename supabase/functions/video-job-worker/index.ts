import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

type EnvReader = (name: string) => string | undefined;
type Fetcher = typeof fetch;

type HandlerDeps = {
  env?: EnvReader;
  fetch?: Fetcher;
  createSupabaseClient?: typeof createClient;
  now?: () => string;
  randomUUID?: () => string;
};

type VideoJob = {
  id: string;
  session_id: string;
  recording_id?: string | null;
  job_kind: string;
  attempts: number;
  max_attempts: number;
  input?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
};

type JobContext = {
  session: Record<string, unknown>;
  recording: Record<string, unknown> | null;
};

type WorkerResult = {
  status: "succeeded" | "needs_review";
  provider?: string;
  model?: string;
  result: Record<string, unknown>;
  events?: Array<Record<string, unknown>>;
  stats?: Array<Record<string, unknown>>;
};

type ProviderAnalysisResult = {
  payload: unknown;
  provider: string;
  model: string;
  needsReview?: boolean;
};

const DEFAULT_HF_VIDEO_MODEL = "MCG-NJU/videomae-base-finetuned-kinetics";
const DEFAULT_MAX_PROVIDER_VIDEO_BYTES = 20 * 1024 * 1024;
const DEFAULT_SIGNED_URL_TTL_SECONDS = 15 * 60;
const VIDEO_STAFF_ROLES = new Set([
  "admin",
  "president",
  "vice_president",
  "girls_coordinator",
  "boys_coordinator",
  "coach_coordinator",
  "youth_head_coach",
  "coach",
  "youth_coach",
  "team_manager"
]);

const jsonHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-worker-secret",
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

const clampInteger = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
};

const getBearerToken = (request: Request) => {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

const envNumber = (env: EnvReader, key: string, fallback: number) => {
  const value = env(key);
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readableKind = (jobKind: string) =>
  jobKind
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const sanitizeEventType = (value: unknown, fallback = "video_classification") =>
  String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || fallback;

const confidenceNumber = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(1, parsed));
};

const asArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

const compactObject = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const nonEmptyString = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

const truthyFlag = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
  return Boolean(value);
};

export const normalizeProviderPayload = (
  payload: unknown,
  context: { session: Record<string, unknown>; recording: Record<string, unknown> | null; job: VideoJob }
) => {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const classifications = Array.isArray(payload)
    ? payload
    : asArray(source.classifications || source.labels || source.predictions);
  const normalizedClassifications = classifications
    .map((item) => item && typeof item === "object" ? item as Record<string, unknown> : null)
    .filter(Boolean)
    .map((item) => ({
      label: String(item?.label || item?.class || item?.name || "unknown"),
      score: confidenceNumber(item?.score ?? item?.confidence ?? item?.probability) ?? 0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const providedEvents = asArray(source.events || source.detections).map((item, index) => {
    const event = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      event_type: sanitizeEventType(event.event_type || event.eventType || event.type || event.label),
      start_ms: clampInteger(event.start_ms ?? event.startMs ?? event.start, 0, 0, Number.MAX_SAFE_INTEGER),
      end_ms: event.end_ms ?? event.endMs ?? event.end === undefined
        ? null
        : clampInteger(event.end_ms ?? event.endMs ?? event.end, 0, 0, Number.MAX_SAFE_INTEGER),
      team_id: event.team_id || event.teamId || context.session.team_id || null,
      player_id: event.player_id || event.playerId || null,
      confidence: confidenceNumber(event.confidence ?? event.score),
      attributes: {
        sourceIndex: index,
        raw: event
      }
    };
  });

  const topClassification = normalizedClassifications[0];
  const inferredEvents = providedEvents.length > 0 || !topClassification
    ? []
    : [{
        event_type: "video_classification",
        start_ms: 0,
        end_ms: null,
        team_id: context.session.team_id || null,
        player_id: null,
        confidence: topClassification.score,
        attributes: {
          label: topClassification.label,
          classifications: normalizedClassifications
        }
      }];

  const events = [...providedEvents, ...inferredEvents];
  const stats = asArray(source.stats || source.statistics).map((item) => {
    const stat = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      stat_type: sanitizeEventType(stat.stat_type || stat.statType || stat.type || "ai_video_stat"),
      stat_value: Number(stat.stat_value ?? stat.statValue ?? stat.value ?? 1) || 1,
      team_id: stat.team_id || stat.teamId || context.session.team_id || null,
      player_id: stat.player_id || stat.playerId || null,
      confidence: confidenceNumber(stat.confidence ?? stat.score),
      metadata: {
        raw: stat
      }
    };
  });

  const summary = typeof source.summary === "string" && source.summary.trim()
    ? source.summary.trim()
    : topClassification
      ? `Top video classification: ${topClassification.label} (${Math.round(topClassification.score * 100)}%).`
      : "Video analysed. No basketball events were detected by the configured provider.";

  return {
    summary,
    classifications: normalizedClassifications,
    events,
    stats,
    rawProviderPayload: payload
  };
};

const createSignedVideoUrl = async ({
  supabase,
  recording,
  env
}: {
  supabase: any;
  recording: Record<string, unknown> | null;
  env: EnvReader;
}) => {
  if (!recording?.bucket_id || !recording?.object_path) return null;
  const ttl = envNumber(env, "VIDEO_SIGNED_URL_TTL_SECONDS", DEFAULT_SIGNED_URL_TTL_SECONDS);
  const { data, error } = await supabase.storage
    .from(String(recording.bucket_id))
    .createSignedUrl(String(recording.object_path), ttl);
  if (error) throw new Error(`Unable to create signed video URL: ${error.message}`);
  return data?.signedUrl || null;
};

const callCustomProvider = async ({
  env,
  fetcher,
  job,
  context,
  signedUrl
}: {
  env: EnvReader;
  fetcher: Fetcher;
  job: VideoJob;
  context: JobContext;
  signedUrl: string | null;
}) => {
  const endpoint = env("VIDEO_ANALYSIS_ENDPOINT");
  if (!endpoint) return null;

  const token = env("VIDEO_ANALYSIS_TOKEN") || env("HF_TOKEN");
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      job,
      session: context.session,
      recording: context.recording,
      videoUrl: signedUrl,
      task: job.job_kind
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Video analysis provider failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = await response.json();
  const metadata = asRecord(payload);

  return {
    payload,
    provider: nonEmptyString(metadata.provider || metadata.source || metadata.vendor) || "custom",
    model: nonEmptyString(metadata.model || metadata.model_id || metadata.modelId || metadata.adapter) || endpoint,
    needsReview: truthyFlag(metadata.needs_review ?? metadata.needsReview ?? metadata.reviewRequired)
  };
};

const callHuggingFaceVideoClassification = async ({
  env,
  fetcher,
  recording,
  signedUrl
}: {
  env: EnvReader;
  fetcher: Fetcher;
  recording: Record<string, unknown> | null;
  signedUrl: string | null;
}) => {
  const hfToken = env("HF_TOKEN");
  if (!hfToken || !signedUrl) return null;

  const maxBytes = envNumber(env, "MAX_PROVIDER_VIDEO_BYTES", DEFAULT_MAX_PROVIDER_VIDEO_BYTES);
  const sizeBytes = Number(recording?.size_bytes || 0);
  if (sizeBytes > maxBytes) {
    return {
      needsReview: true,
      provider: "huggingface",
      model: env("HF_VIDEO_MODEL") || DEFAULT_HF_VIDEO_MODEL,
      payload: {
        summary: "Video is stored and ready for review. It is too large for direct Edge Function video classification; configure VIDEO_ANALYSIS_ENDPOINT for full-game processing.",
        classifications: [],
        events: []
      }
    };
  }

  const videoResponse = await fetcher(signedUrl);
  if (!videoResponse.ok) throw new Error(`Unable to download signed video for analysis (${videoResponse.status}).`);

  const model = env("HF_VIDEO_MODEL") || DEFAULT_HF_VIDEO_MODEL;
  const endpoint = env("HF_VIDEO_ENDPOINT") || `https://router.huggingface.co/hf-inference/models/${model}`;
  const metadata = asRecord(recording?.metadata);
  const providerResponse = await fetcher(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hfToken}`,
      "Content-Type": String(metadata.contentType || "application/octet-stream"),
      "X-Wait-For-Model": "true"
    },
    body: await videoResponse.arrayBuffer()
  });

  if (!providerResponse.ok) {
    const detail = await providerResponse.text().catch(() => "");
    throw new Error(`Hugging Face video analysis failed (${providerResponse.status}): ${detail.slice(0, 300)}`);
  }

  return {
    payload: await providerResponse.json(),
    provider: "huggingface",
    model
  };
};

const noProviderResult = (context: JobContext) => ({
  status: "needs_review" as const,
  provider: "none",
  model: "manual-review",
  result: {
    summary: "Video was uploaded successfully and is ready for staff review. Configure VIDEO_ANALYSIS_ENDPOINT or HF_TOKEN/HF_VIDEO_MODEL to run automated video AI.",
    sessionId: context.session.id,
    recordingId: context.recording?.id || null,
    eventsDetected: 0,
    statsGenerated: 0,
    reviewRequired: true
  },
  events: [],
  stats: []
});

const buildTranscodeResult = (job: VideoJob, context: JobContext): WorkerResult => ({
  status: "succeeded",
  provider: "supabase-edge",
  model: "source-retained",
  result: {
    summary: "Source video retained in private Supabase Storage for staff review.",
    transcodeStrategy: "source-retained",
    bucketId: context.recording?.bucket_id || job.input?.bucketId || null,
    objectPath: context.recording?.object_path || job.input?.objectPath || null,
    sizeBytes: context.recording?.size_bytes || null,
    outputs: context.recording ? [{
      bucketId: context.recording.bucket_id,
      objectPath: context.recording.object_path,
      role: "source"
    }] : []
  }
});

const buildQualityCheckResult = (context: JobContext): WorkerResult => ({
  status: "succeeded",
  provider: "supabase-edge",
  model: "metadata-quality-check",
  result: {
    summary: "Recording metadata is present and storage object is addressable.",
    hasRecording: Boolean(context.recording),
    bucketId: context.recording?.bucket_id || null,
    objectPath: context.recording?.object_path || null,
    cameraRole: context.recording?.camera_role || null,
    sizeBytes: context.recording?.size_bytes || null
  }
});

const runVisionAnalysis = async ({
  env,
  fetcher,
  supabase,
  job,
  context
}: {
  env: EnvReader;
  fetcher: Fetcher;
  supabase: any;
  job: VideoJob;
  context: JobContext;
}): Promise<WorkerResult> => {
  const signedUrl = await createSignedVideoUrl({ supabase, recording: context.recording, env });
  let providerError: unknown = null;
  let providerResult: ProviderAnalysisResult | null = null;

  try {
    providerResult = await callCustomProvider({ env, fetcher, job, context, signedUrl });
  } catch (error) {
    providerError = error;
  }

  if (!providerResult) {
    try {
      providerResult = await callHuggingFaceVideoClassification({ env, fetcher, recording: context.recording, signedUrl });
    } catch (error) {
      providerError = error;
    }
  }

  if (!providerResult && providerError) {
    const message = providerError instanceof Error ? providerError.message : "The configured video AI provider did not return a result.";
    return {
      status: "needs_review",
      provider: "provider-error",
      model: env("HF_VIDEO_MODEL") || env("VIDEO_ANALYSIS_ENDPOINT") || DEFAULT_HF_VIDEO_MODEL,
      result: {
        summary: "Video was uploaded and queued, but automated vision analysis could not complete. It is ready for manual staff review.",
        error: message,
        reviewRequired: true,
        eventsDetected: 0,
        statsGenerated: 0
      },
      events: [],
      stats: []
    };
  }

  if (!providerResult) return noProviderResult(context);

  const normalized = normalizeProviderPayload(providerResult.payload, { ...context, job });
  const needsReview = Boolean(providerResult.needsReview);

  return {
    status: needsReview ? "needs_review" : "succeeded",
    provider: providerResult.provider,
    model: providerResult.model,
    result: {
      summary: normalized.summary,
      analysisProvider: providerResult.provider,
      analysisModel: providerResult.model,
      classifications: normalized.classifications,
      eventsDetected: normalized.events.length,
      statsGenerated: normalized.stats.length,
      reviewRequired: true,
      rawProviderPayload: normalized.rawProviderPayload
    },
    events: normalized.events,
    stats: normalized.stats
  };
};

const buildStatExtraction = async ({
  supabase,
  job,
  context
}: {
  supabase: any;
  job: VideoJob;
  context: JobContext;
}): Promise<WorkerResult> => {
  const { data: events, error } = await supabase
    .from("video_events")
    .select("*")
    .eq("session_id", job.session_id);
  if (error) throw new Error(`Unable to read detected video events: ${error.message}`);

  const eventRows = events || [];
  const counts = eventRows.reduce((acc: Record<string, number>, event: Record<string, unknown>) => {
    const key = String(event.event_type || "event");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const stats = Object.entries(counts).map(([eventType, count]) => ({
    stat_type: `${eventType}_count`,
    stat_value: count,
    team_id: context.session.team_id || null,
    player_id: null,
    confidence: null,
    metadata: {
      source: "video_event_rollup",
      analysisJobId: job.id
    }
  }));

  return {
    status: "succeeded",
    provider: "supabase-edge",
    model: "event-rollup",
    result: {
      summary: stats.length
        ? `Generated ${stats.length} stat rollup${stats.length === 1 ? "" : "s"} from detected events.`
        : "No detected video events were available for stat extraction yet.",
      eventCounts: counts,
      statsGenerated: stats.length
    },
    stats
  };
};

const insertEvents = async (supabase: any, job: VideoJob, context: JobContext, events: Array<Record<string, unknown>> = []) => {
  await supabase.from("video_events").delete().eq("analysis_job_id", job.id);
  if (events.length === 0) return 0;

  const rows = events.map((event) => ({
    session_id: job.session_id,
    recording_id: job.recording_id || context.recording?.id || null,
    analysis_job_id: job.id,
    event_type: sanitizeEventType(event.event_type || event.eventType || event.type),
    period: event.period || null,
    game_clock: event.game_clock || event.gameClock || null,
    start_ms: clampInteger(event.start_ms ?? event.startMs, 0, 0, Number.MAX_SAFE_INTEGER),
    end_ms: event.end_ms ?? event.endMs ?? null,
    team_id: event.team_id || event.teamId || context.session.team_id || null,
    player_id: event.player_id || event.playerId || null,
    secondary_player_id: event.secondary_player_id || event.secondaryPlayerId || null,
    confidence: confidenceNumber(event.confidence),
    source: "ai",
    status: "detected",
    court_position: event.court_position || event.courtPosition || {},
    bounding_boxes: event.bounding_boxes || event.boundingBoxes || [],
    attributes: {
      ...(event.attributes && typeof event.attributes === "object" ? event.attributes : {}),
      analysisJobId: job.id,
      providerJobKind: job.job_kind
    }
  }));

  const { error } = await supabase.from("video_events").insert(rows);
  if (error) throw new Error(`Unable to insert video events: ${error.message}`);
  return rows.length;
};

const insertStats = async (supabase: any, job: VideoJob, context: JobContext, stats: Array<Record<string, unknown>> = []) => {
  await supabase.from("game_video_stats").delete().eq("metadata->>analysisJobId", job.id);
  if (stats.length === 0) return 0;

  const rows = stats.map((stat) => ({
    session_id: job.session_id,
    game_id: context.session.game_id || null,
    team_id: stat.team_id || stat.teamId || context.session.team_id || null,
    player_id: stat.player_id || stat.playerId || null,
    stat_type: sanitizeEventType(stat.stat_type || stat.statType || stat.type || "ai_video_stat"),
    stat_value: Number(stat.stat_value ?? stat.statValue ?? stat.value ?? 1) || 1,
    period: stat.period || null,
    game_clock: stat.game_clock || stat.gameClock || null,
    confidence: confidenceNumber(stat.confidence),
    source: "ai",
    status: "detected",
    metadata: {
      ...(stat.metadata && typeof stat.metadata === "object" ? stat.metadata : {}),
      analysisJobId: job.id,
      providerJobKind: job.job_kind
    }
  }));

  const { error } = await supabase.from("game_video_stats").insert(rows);
  if (error) throw new Error(`Unable to insert game video stats: ${error.message}`);
  return rows.length;
};

const insertShotDocuments = async (
  supabase: any,
  job: VideoJob,
  context: JobContext,
  events: Array<Record<string, unknown>> = []
) => {
  const shotEvents = events.filter((event) => sanitizeEventType(event.event_type || event.type).includes("shot"));
  if (shotEvents.length === 0) return 0;

  const rows = shotEvents.map((event, index) => {
    const id = `video-${job.id}-${index + 1}`;
    const courtPosition = asRecord(event.court_position || event.courtPosition);
    return {
      collection: "shot_events",
      id,
      data: compactObject({
        id,
        playerId: event.player_id || event.playerId || null,
        playerName: event.playerName || "Unknown Player",
        teamId: event.team_id || event.teamId || context.session.team_id || null,
        teamName: context.session.teamName || context.session.team_name || null,
        gameId: context.session.game_id || null,
        gameDate: context.session.session_date || context.session.created_at || null,
        opponent: context.session.opponent || null,
        x: event.x ?? courtPosition.x ?? null,
        y: event.y ?? courtPosition.y ?? null,
        outcome: event.outcome || "unknown",
        made: event.made ?? false,
        value: event.value || 2,
        shotType: event.shotType || event.event_type || "video shot",
        source: "video_ai_reviewed",
        confidence: confidenceNumber(event.confidence) ?? 0.5,
        analysisJobId: job.id,
        videoSessionId: job.session_id
      }),
      created_by: null,
      updated_by: null
    };
  });

  const { error } = await supabase.from("documents").upsert(rows, { onConflict: "collection,id" });
  if (error) throw new Error(`Unable to write shot event documents: ${error.message}`);
  return rows.length;
};

const loadJobContext = async (supabase: any, job: VideoJob): Promise<JobContext> => {
  const { data: session, error: sessionError } = await supabase
    .from("video_recording_sessions")
    .select("*")
    .eq("id", job.session_id)
    .single();
  if (sessionError) throw new Error(`Unable to load video session: ${sessionError.message}`);

  let recording = null;
  if (job.recording_id) {
    const { data, error } = await supabase
      .from("video_recordings")
      .select("*")
      .eq("id", job.recording_id)
      .maybeSingle();
    if (error) throw new Error(`Unable to load video recording: ${error.message}`);
    recording = data || null;
  }

  return { session, recording };
};

const updateSessionStatus = async (supabase: any, sessionId: string) => {
  const { data: jobs, error } = await supabase
    .from("video_analysis_jobs")
    .select("status")
    .eq("session_id", sessionId);
  if (error) throw new Error(`Unable to refresh video session status: ${error.message}`);

  const statuses = (jobs || []).map((job: Record<string, unknown>) => String(job.status));
  const active = statuses.some((status) => status === "queued" || status === "running");
  const complete = statuses.length > 0 && statuses.every((status) => (
    status === "succeeded" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "needs_review"
  ));
  const nextStatus = active ? "analysing" : complete ? "review" : "queued";

  const { data: session } = await supabase
    .from("video_recording_sessions")
    .select("metadata")
    .eq("id", sessionId)
    .maybeSingle();
  const metadata = asRecord(session?.metadata);

  const { error: updateError } = await supabase
    .from("video_recording_sessions")
    .update({
      status: nextStatus,
      metadata: {
        ...metadata,
        workerUpdatedAt: new Date().toISOString(),
        jobStatuses: statuses
      }
    })
    .eq("id", sessionId);
  if (updateError) throw new Error(`Unable to update video session status: ${updateError.message}`);
};

const completeJob = async (
  supabase: any,
  job: VideoJob,
  workerResult: WorkerResult,
  now: () => string
) => {
  const { error } = await supabase
    .from("video_analysis_jobs")
    .update({
      status: workerResult.status,
      provider: workerResult.provider || null,
      model: workerResult.model || null,
      result: workerResult.result,
      error_message: null,
      locked_by: null,
      locked_at: null,
      completed_at: now()
    })
    .eq("id", job.id);
  if (error) throw new Error(`Unable to complete video job: ${error.message}`);
};

const failJob = async (supabase: any, job: VideoJob, error: unknown) => {
  const message = error instanceof Error ? error.message : "Video job failed.";
  const nextStatus = job.attempts >= job.max_attempts ? "failed" : "queued";
  await supabase
    .from("video_analysis_jobs")
    .update({
      status: nextStatus,
      error_message: message,
      locked_by: null,
      locked_at: null,
      completed_at: nextStatus === "failed" ? new Date().toISOString() : null
    })
    .eq("id", job.id);
};

const processJob = async ({
  env,
  fetcher,
  supabase,
  job,
  now
}: {
  env: EnvReader;
  fetcher: Fetcher;
  supabase: any;
  job: VideoJob;
  now: () => string;
}) => {
  const context = await loadJobContext(supabase, job);
  await supabase.from("video_recording_sessions").update({ status: "analysing" }).eq("id", job.session_id);

  const workerResult = job.job_kind === "transcode"
    ? buildTranscodeResult(job, context)
    : job.job_kind === "quality_check"
      ? buildQualityCheckResult(context)
      : job.job_kind === "vision_event_detection"
        ? await runVisionAnalysis({ env, fetcher, supabase, job, context })
        : job.job_kind === "stat_extraction"
          ? await buildStatExtraction({ supabase, job, context })
          : {
              status: "needs_review" as const,
              provider: "supabase-edge",
              model: "unsupported-job-kind",
              result: {
                summary: `${readableKind(job.job_kind)} is not supported by the current worker.`,
                reviewRequired: true
              }
            };

  const eventCount = await insertEvents(supabase, job, context, workerResult.events);
  const statCount = await insertStats(supabase, job, context, workerResult.stats);
  const shotDocumentCount = await insertShotDocuments(supabase, job, context, workerResult.events);

  await completeJob(supabase, job, {
    ...workerResult,
    result: {
      ...workerResult.result,
      eventRowsWritten: eventCount,
      statRowsWritten: statCount,
      shotDocumentsWritten: shotDocumentCount
    }
  }, now);
  await updateSessionStatus(supabase, job.session_id);

  return {
    id: job.id,
    jobKind: job.job_kind,
    status: workerResult.status,
    eventRowsWritten: eventCount,
    statRowsWritten: statCount,
    shotDocumentsWritten: shotDocumentCount
  };
};

const verifyStaffToken = async ({
  env,
  fetcher,
  token,
  supabase
}: {
  env: EnvReader;
  fetcher: Fetcher;
  token: string;
  supabase: any;
}) => {
  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return false;

  const response = await fetcher(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey
    }
  });
  if (!response.ok) return false;

  const user = await response.json().catch(() => null);
  if (!user?.id) return false;

  const { data, error } = await supabase
    .from("documents")
    .select("data")
    .eq("collection", "users")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data?.data?.role) return false;

  return VIDEO_STAFF_ROLES.has(String(data.data.role));
};

const authorized = async ({
  request,
  env,
  fetcher,
  supabase
}: {
  request: Request;
  env: EnvReader;
  fetcher: Fetcher;
  supabase: any;
}) => {
  const workerSecret = env("VIDEO_WORKER_SECRET");
  const providedSecret = request.headers.get("x-worker-secret");
  if (workerSecret && providedSecret && providedSecret === workerSecret) return true;

  const token = getBearerToken(request);
  if (!token) return false;
  return verifyStaffToken({ env, fetcher, token, supabase });
};

export const createHandler = (deps: HandlerDeps = {}) => {
  const env = deps.env || ((name: string) => Deno.env.get(name));
  const fetcher = deps.fetch || fetch;
  const clientFactory = deps.createSupabaseClient || createClient;
  const now = deps.now || (() => new Date().toISOString());
  const randomUUID = deps.randomUUID || (() => crypto.randomUUID());

  return async (request: Request) => {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: jsonHeaders(origin) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, { status: 405 }, origin);
    }

    const supabaseUrl = env("SUPABASE_URL");
    const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Video worker is not configured." }, { status: 500 }, origin);
    }

    const supabase = clientFactory(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    if (!(await authorized({ request, env, fetcher, supabase }))) {
      return jsonResponse({ error: "Not authorized to run the video worker." }, { status: 401 }, origin);
    }

    const body = await request.json().catch(() => ({}));
    const limit = clampInteger(body?.limit, 3, 1, 10);
    const jobId = typeof body?.jobId === "string" && body.jobId.trim() ? body.jobId.trim() : null;
    const workerId = `video-worker-${randomUUID()}`;

    const { data: jobs, error } = await supabase.rpc("claim_video_analysis_jobs", {
      p_worker_id: workerId,
      p_batch_size: limit,
      p_job_id: jobId
    });
    if (error) {
      return jsonResponse({ error: `Unable to claim video jobs: ${error.message}` }, { status: 500 }, origin);
    }

    const processed = [];
    for (const job of (jobs || []) as VideoJob[]) {
      try {
        processed.push(await processJob({ env, fetcher, supabase, job, now }));
      } catch (error) {
        await failJob(supabase, job, error);
        await updateSessionStatus(supabase, job.session_id).catch(() => {});
        processed.push({
          id: job.id,
          jobKind: job.job_kind,
          status: "failed",
          error: error instanceof Error ? error.message : "Video job failed."
        });
      }
    }

    return jsonResponse({
      claimed: jobs?.length || 0,
      processed
    }, { status: 200 }, origin);
  };
};

if (import.meta.main) {
  Deno.serve(createHandler());
}
