# Video AI Worker

The production video queue is processed by the Supabase Edge Function `video-job-worker` on project `lipjgbcgwokhucbxinmn`.

## Runtime

- Claims queued rows through `public.claim_video_analysis_jobs(...)` so concurrent worker calls do not process the same job.
- Runs from the coach Video Analysis page after upload and through the `Run Worker` button for existing queued jobs.
- Also runs from the GitHub Actions workflow `.github/workflows/video-worker.yml` every 10 minutes and on manual dispatch.
- Supports `transcode`, `quality_check`, `vision_event_detection`, `stat_extraction`, and safe manual-review fallback for unsupported job kinds.
- Writes worker output back to `video_analysis_jobs.result`, `video_events`, `game_video_stats`, and compatible `documents` `shot_events` rows when shot events are returned.

## Secrets

Configured in Supabase Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HF_TOKEN`
- `VIDEO_WORKER_SECRET`

Optional provider controls:

- `VIDEO_ANALYSIS_ENDPOINT` for a custom basketball video analysis service.
- `VIDEO_ANALYSIS_TOKEN` for that custom endpoint.
- `VIDEO_SIGNED_URL_TTL_SECONDS` to control how long the private signed video URL remains valid for the custom endpoint.
- `HF_VIDEO_MODEL` to override the default Hugging Face video classification model.
- `HF_VIDEO_ENDPOINT` to override the Hugging Face router URL.
- `MAX_PROVIDER_VIDEO_BYTES` to limit direct Edge Function video upload to an AI provider.

## Custom Provider Contract

When `VIDEO_ANALYSIS_ENDPOINT` is configured, the worker sends:

```json
{
  "job": { "...": "video_analysis_jobs row" },
  "session": { "...": "video_recording_sessions row" },
  "recording": { "...": "video_recordings row or null" },
  "videoUrl": "short-lived signed Supabase Storage URL",
  "task": "vision_event_detection"
}
```

The request includes `Authorization: Bearer <VIDEO_ANALYSIS_TOKEN>` when `VIDEO_ANALYSIS_TOKEN` is set.

The strongest response shape for a Roboflow/open-source adapter is:

```json
{
  "provider": "roboflow-shot-mvp",
  "model": "rf-detr-ball-rim-player-v1",
  "needsReview": true,
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
        { "label": "ball", "x": 320, "y": 180, "width": 18, "height": 18, "confidence": 0.91 }
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

Raw Roboflow `predictions` should be converted by the adapter into app-level `events` and `stats`; otherwise they will only be stored as a generic classification result.

## Current Production Behavior

Large videos are kept in private Supabase Storage and marked `needs_review` for the vision job unless a full-game `VIDEO_ANALYSIS_ENDPOINT` is configured. This keeps uploads from getting stuck while preserving a path to add a stronger basketball-specific video model later.
