import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler, normalizeProviderPayload } from "./index.ts";

const context = {
  job: {
    id: "job-1",
    session_id: "session-1",
    recording_id: "recording-1",
    job_kind: "vision_event_detection",
    attempts: 1,
    max_attempts: 3
  },
  session: {
    id: "session-1",
    team_id: "team-1"
  },
  recording: {
    id: "recording-1"
  }
};

Deno.test("video-job-worker normalizes custom adapter events and stats", () => {
  const normalized = normalizeProviderPayload({
    provider: "roboflow-shot-mvp",
    model: "rf-detr-ball-rim-player-v1",
    summary: "Detected 2 shot candidates for coach review.",
    events: [{
      event_type: "shot_attempt",
      start_ms: 1234,
      end_ms: 2400,
      confidence: 0.82,
      court_position: { x: 42, y: 18 },
      bounding_boxes: [{ label: "ball", confidence: 0.91 }]
    }],
    stats: [{
      stat_type: "shot_attempt_count",
      stat_value: 2,
      confidence: 0.74
    }]
  }, context);

  assertEquals(normalized.summary, "Detected 2 shot candidates for coach review.");
  assertEquals(normalized.events.length, 1);
  assertEquals(normalized.events[0].event_type, "shot_attempt");
  assertEquals(normalized.events[0].team_id, "team-1");
  assertEquals(normalized.events[0].confidence, 0.82);
  assertEquals(normalized.stats.length, 1);
  assertEquals(normalized.stats[0].stat_type, "shot_attempt_count");
  assertEquals(normalized.stats[0].stat_value, 2);
});

Deno.test("video-job-worker falls back to classification event when no events are provided", () => {
  const normalized = normalizeProviderPayload({
    predictions: [
      { label: "basketball play", score: 0.43 },
      { label: "timeout", score: 0.21 }
    ]
  }, context);

  assertEquals(normalized.classifications.length, 2);
  assertEquals(normalized.events.length, 1);
  assertEquals(normalized.events[0].event_type, "video_classification");
  assertEquals(normalized.events[0].team_id, "team-1");
  assertEquals(normalized.stats.length, 0);
});

Deno.test("video-job-worker writes custom adapter geometry, stats metadata, and review status", async () => {
  const job = {
    id: "job-adapter-1",
    session_id: "session-adapter-1",
    recording_id: "recording-adapter-1",
    job_kind: "vision_event_detection",
    attempts: 1,
    max_attempts: 3
  };
  const session = {
    id: "session-adapter-1",
    team_id: "team-adapter-1",
    game_id: "game-adapter-1",
    team_name: "U12 Boys",
    session_date: "2026-04-27",
    metadata: {}
  };
  const recording = {
    id: "recording-adapter-1",
    bucket_id: "club-video",
    object_path: "u12/game.mp4",
    size_bytes: 1024,
    metadata: { contentType: "video/mp4" }
  };
  const insertedEvents: Array<Record<string, unknown>> = [];
  const insertedStats: Array<Record<string, unknown>> = [];
  const upsertedDocuments: Array<Record<string, unknown>> = [];
  const jobUpdates: Array<Record<string, unknown>> = [];
  const env: Record<string, string> = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    VIDEO_WORKER_SECRET: "worker-secret",
    VIDEO_ANALYSIS_ENDPOINT: "https://adapter.example/analyze",
    VIDEO_ANALYSIS_TOKEN: "adapter-token",
    VIDEO_SIGNED_URL_TTL_SECONDS: "900"
  };

  const supabase = {
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: (path: string, ttl: number) => Promise.resolve({
          data: { signedUrl: `https://storage.example/${bucket}/${path}?ttl=${ttl}` },
          error: null
        })
      })
    },
    rpc: (name: string) => {
      assertEquals(name, "claim_video_analysis_jobs");
      return Promise.resolve({ data: [job], error: null });
    },
    from: (table: string) => {
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        delete: () => builder,
        update: (payload: Record<string, unknown>) => {
          if (table === "video_analysis_jobs") jobUpdates.push(payload);
          return builder;
        },
        insert: (rows: Array<Record<string, unknown>>) => {
          if (table === "video_events") insertedEvents.push(...rows);
          if (table === "game_video_stats") insertedStats.push(...rows);
          return Promise.resolve({ error: null });
        },
        upsert: (rows: Array<Record<string, unknown>>) => {
          if (table === "documents") upsertedDocuments.push(...rows);
          return Promise.resolve({ error: null });
        },
        single: () => Promise.resolve({
          data: table === "video_recording_sessions" ? session : null,
          error: null
        }),
        maybeSingle: () => Promise.resolve({
          data: table === "video_recordings" ? recording : { metadata: {} },
          error: null
        }),
        then: (resolve: (value: unknown) => void) => {
          if (table === "video_analysis_jobs") {
            return Promise.resolve({ data: [{ status: "needs_review" }], error: null }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        }
      };
      return builder;
    }
  };

  const fetcher = async (_input: RequestInfo | URL, init?: RequestInit) => {
    assertEquals((init?.headers as Record<string, string>)?.Authorization, "Bearer adapter-token");
    return new Response(JSON.stringify({
      provider: "roboflow-shot-mvp",
      model: "rf-detr-ball-rim-player-v1",
      needsReview: true,
      summary: "Detected shot candidates for coach review.",
      events: [{
        event_type: "shot_attempt",
        start_ms: 1234,
        end_ms: 2200,
        confidence: 0.86,
        player_id: "player-7",
        court_position: { x: 42, y: 18, zone: "left-wing" },
        bounding_boxes: [
          { label: "ball", x: 0.51, y: 0.32, width: 0.04, height: 0.04, confidence: 0.93 },
          { label: "rim", x: 0.74, y: 0.21, width: 0.12, height: 0.08, confidence: 0.88 }
        ],
        attributes: { camera: "sideline-centre" }
      }],
      stats: [{
        stat_type: "shot_attempt_count",
        stat_value: 1,
        confidence: 0.79,
        metadata: {
          evidenceFrameMs: 1234,
          sourceEventType: "shot_attempt"
        }
      }]
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  const handler = createHandler({
    env: (name: string) => env[name],
    fetch: fetcher,
    createSupabaseClient: (() => supabase) as any,
    now: () => "2026-04-30T00:00:00.000Z",
    randomUUID: () => "worker-id"
  });

  const response = await handler(new Request("https://worker.example/video-job-worker", {
    method: "POST",
    headers: { "x-worker-secret": "worker-secret" },
    body: JSON.stringify({ limit: 1 })
  }));
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.processed[0].status, "needs_review");

  assertEquals(insertedEvents.length, 1);
  assertEquals(insertedEvents[0].court_position, { x: 42, y: 18, zone: "left-wing" });
  assertEquals(insertedEvents[0].bounding_boxes, [
    { label: "ball", x: 0.51, y: 0.32, width: 0.04, height: 0.04, confidence: 0.93 },
    { label: "rim", x: 0.74, y: 0.21, width: 0.12, height: 0.08, confidence: 0.88 }
  ]);

  assertEquals(insertedStats.length, 1);
  assertEquals((insertedStats[0].metadata as Record<string, unknown>).raw, {
    stat_type: "shot_attempt_count",
    stat_value: 1,
    confidence: 0.79,
    metadata: {
      evidenceFrameMs: 1234,
      sourceEventType: "shot_attempt"
    }
  });

  assertEquals(upsertedDocuments.length, 1);
  assertEquals((upsertedDocuments[0].data as Record<string, unknown>).x, 42);
  assertEquals((upsertedDocuments[0].data as Record<string, unknown>).y, 18);

  assertEquals(jobUpdates.length, 1);
  assertEquals(jobUpdates[0].status, "needs_review");
  assertEquals(jobUpdates[0].provider, "roboflow-shot-mvp");
  assertEquals(jobUpdates[0].model, "rf-detr-ball-rim-player-v1");
  assertEquals((jobUpdates[0].result as Record<string, unknown>).analysisProvider, "roboflow-shot-mvp");
  assertEquals((jobUpdates[0].result as Record<string, unknown>).analysisModel, "rf-detr-ball-rim-player-v1");
});
