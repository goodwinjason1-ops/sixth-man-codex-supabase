# Roboflow And Open-Source Video AI Start

Date: 2026-04-30

This document starts the build-it-ourselves path for Sixth Man basketball video analysis. It is deliberately scoped to a narrow first milestone: reviewable shot-chart and shot-attempt candidates, not full automatic box-score generation.

## Decision

Build the first open-source/Roboflow system as an external adapter behind the existing `VIDEO_ANALYSIS_ENDPOINT`.

Do not put heavy video inference inside the Supabase Edge Function. The Edge Function should keep doing orchestration, signed URL creation, job claiming, and persistence. The external adapter should do video download, frame sampling, model inference, tracking, event construction, and return normalized JSON.

## Existing App Integration Point

The current video worker already sends this payload to `VIDEO_ANALYSIS_ENDPOINT`:

```json
{
  "job": { "...": "video_analysis_jobs row" },
  "session": { "...": "video_recording_sessions row" },
  "recording": { "...": "video_recordings row or null" },
  "videoUrl": "short-lived signed Supabase Storage URL",
  "task": "vision_event_detection"
}
```

Headers:

- `Content-Type: application/json`
- `Authorization: Bearer <VIDEO_ANALYSIS_TOKEN>` if set

Best first adapter response shape:

```json
{
  "summary": "Detected 4 shot candidates for coach review.",
  "events": [
    {
      "event_type": "shot_attempt",
      "start_ms": 123400,
      "end_ms": 126000,
      "team_id": "team-id",
      "player_id": null,
      "confidence": 0.78,
      "court_position": { "x": 42, "y": 18 },
      "bounding_boxes": [
        {
          "label": "ball",
          "x": 320,
          "y": 180,
          "width": 18,
          "height": 18,
          "confidence": 0.91
        }
      ],
      "attributes": {
        "outcome": "unknown",
        "adapter": "roboflow-shot-mvp"
      }
    }
  ],
  "stats": [
    {
      "stat_type": "shot_attempt_count",
      "stat_value": 4,
      "team_id": "team-id",
      "player_id": null,
      "confidence": 0.7,
      "metadata": { "source": "roboflow-shot-mvp" }
    }
  ]
}
```

Important: raw Roboflow `predictions` alone are not enough. The adapter must convert detections into app-level `events` and `stats`.

## Recommended Stack

| Layer | Recommended option | Why |
| --- | --- | --- |
| Annotation | CVAT, Label Studio | Open-source video/frame annotation and track labelling. CVAT is strongest for video tracks. |
| Dataset QA | FiftyOne, Datumaro | Dataset inspection, format conversion, model failure review. |
| Detection | RF-DETR or a carefully licensed YOLO path | RF-DETR has Apache-2.0 components and strong Roboflow alignment. YOLO is easy, but licensing must be handled carefully. |
| Detection utilities | `roboflow/supervision` | MIT, excellent glue for detections, zones, tracking, and video annotation. |
| Tracking | `roboflow/trackers`, ByteTrack | Apache/MIT options for player/ball continuity. |
| Sports examples | `roboflow/sports` | MIT examples and sports-specific patterns for calibration, jersey OCR direction, and court/field workflows. |
| Basketball references | DeepSportradar calibration, sketscripter court mapping, shot detection repos | Use for ideas and architecture. Only reuse code when license is compatible. |
| Adapter service | Python/FastAPI worker | Better fit for OpenCV, FFmpeg, PyTorch, and GPU hosting than Supabase Edge Functions. |

## Open-Source Reuse Rules

Safe-to-reuse candidates:

- `roboflow/supervision` - MIT
- `roboflow/sports` - MIT, but check separate model/data terms
- `roboflow/trackers` - Apache-2.0
- `roboflow/rf-detr` - Apache-2.0 for open components and designated weights
- `FoundationVision/ByteTrack` - MIT
- `sketscripter/Computer-vision-basketball-court-mapping-and-player-tracking` - Apache-2.0
- `CVAT` - MIT
- `Label Studio` - Apache-2.0
- `FiftyOne` - Apache-2.0
- `Datumaro` - MIT

Use as inspiration only unless licensing is verified:

- `chonyy/basketball-shot-detection`
- `browlm13/Basketball-Shot-Detection`
- `AggieSportsAnalytics/ShotTracker`
- `kylephan5/basketball-shot-tracker`
- DeepSportradar challenge repos with unclear or specialist licences
- NonCommercial jersey OCR pipelines

Avoid accidental license traps:

- `ultralytics/ultralytics` is AGPL-3.0 unless using an enterprise licence.
- `mikel-brostrom/boxmot` is AGPL-3.0.
- Any repo with model weights but unclear training data should be treated as inspiration only.

## MVP Scope

First milestone: `roboflow-shot-mvp`.

Inputs:

- Signed Supabase video URL.
- Job/session metadata.
- Optional team and roster metadata later.

Outputs:

- Shot-attempt candidates.
- Start/end timestamps.
- Rough court coordinates where possible.
- Ball/rim/player bounding boxes as evidence.
- Confidence score.
- Coach-review status.
- Summary count stat.

Explicitly out of scope for MVP:

- Fully automatic box scores.
- Reliable assists, rebounds, steals, blocks, fouls, and turnovers.
- Player identity without coach review.
- Parent/committee-visible AI stats without approval.

## First Implementation Plan

1. Add a small external adapter service skeleton.
   - `POST /analyze`
   - Validate bearer token.
   - Accept the existing `VIDEO_ANALYSIS_ENDPOINT` payload.
   - Download the signed video URL.
   - Return deterministic sample `events`/`stats` while the model path is wired.

2. Add local test fixtures.
   - Mock video job payload.
   - Expected normalized response.
   - Failure response.

3. Add worker tests in Supabase code.
   - Verify signed URL and bearer token are sent.
   - Verify adapter events become `video_events`.
   - Verify adapter stats become `game_video_stats`.
   - Verify provider failure falls back to `needs_review`.

4. Add environment docs.
   - `VIDEO_ANALYSIS_ENDPOINT`
   - `VIDEO_ANALYSIS_TOKEN`
   - `VIDEO_SIGNED_URL_TTL_SECONDS`
   - Adapter hosting notes.

5. Add the first real inference step.
   - Frame sampling at a low FPS first.
   - Detect ball/rim/player/court keypoints.
   - Track ball movement.
   - Generate shot-attempt candidates only.

6. Add coach review workflow improvements later.
   - Confirm/change event.
   - Assign player.
   - Mark make/miss.
   - Exclude false positive.

## Recommended First Code Change

Completed first repo-side start:

- `scripts/video-ai-adapter/analyzer.mjs` defines a deterministic adapter contract implementation.
- `scripts/video-ai-adapter/server.mjs` exposes `GET /health` and `POST /analyze`.
- `npm run adapter:video-ai:test` runs the adapter contract tests.
- `npm run adapter:video-ai` starts the local adapter on `VIDEO_AI_ADAPTER_PORT` or `8788`.

The adapter currently returns one low-confidence `shot_attempt` smoke event and one `shot_attempt_count` stat so the Supabase worker integration can be exercised before real model inference is enabled.

The earlier worker contract changes already preserve custom provider metadata and `needsReview`, so the next step is to point the worker at this adapter in a development Supabase environment and confirm the returned event/stat rows are persisted correctly.

Verification completed for this first adapter start:

- `npm run adapter:video-ai:test` passed 5 tests.
- `node --check scripts/video-ai-adapter/server.mjs` passed.
- Local HTTP smoke of `GET /health` and `POST /analyze` returned 1 review-only event and 1 stat.

Before writing real model inference, keep the worker contract stable:

- Do not regress provider metadata returned by the custom endpoint.
- Do not regress `needsReview` propagation.
- Keep `normalizeProviderPayload` tests passing.
- Keep `docs/video-ai-worker.md` aligned with the adapter response shape.

This gives a stable contract before model code enters the picture.

## Local Adapter Usage

Start the local deterministic adapter:

```powershell
$env:VIDEO_AI_ADAPTER_TOKEN = "local-dev-token"
npm run adapter:video-ai
```

Point the Supabase worker at it in development:

```text
VIDEO_ANALYSIS_ENDPOINT=http://localhost:8788/analyze
VIDEO_ANALYSIS_TOKEN=local-dev-token
```

Production should use a hosted adapter with HTTPS, token auth, private logs, and no persistent storage of junior footage unless explicitly approved.

## Quality Gates

Do not show AI-generated shot stats to parents or committees until:

- Coaches can review and correct events.
- At least two full games are manually scored as ground truth.
- Shot attempt detection precision is acceptable.
- Player identity is explicitly confirmed or hidden.
- Privacy and consent terms for uploaded youth footage are documented.
