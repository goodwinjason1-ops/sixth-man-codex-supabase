# Video AI Worker

The production video queue is processed by the Supabase Edge Function `video-job-worker` on project `lipjgbcgwokhucbxinmn`.

## Runtime

- Claims queued rows through `public.claim_video_analysis_jobs(...)` so concurrent worker calls do not process the same job.
- Runs from the coach Video Analysis page after upload and through the `Run Worker` button for existing queued jobs.
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
- `HF_VIDEO_MODEL` to override the default Hugging Face video classification model.
- `HF_VIDEO_ENDPOINT` to override the Hugging Face router URL.
- `MAX_PROVIDER_VIDEO_BYTES` to limit direct Edge Function video upload to an AI provider.

## Current Production Behavior

Large videos are kept in private Supabase Storage and marked `needs_review` for the vision job unless a full-game `VIDEO_ANALYSIS_ENDPOINT` is configured. This keeps uploads from getting stuck while preserving a path to add a stronger basketball-specific video model later.
