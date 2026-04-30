import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeProviderPayload } from "./index.ts";

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
