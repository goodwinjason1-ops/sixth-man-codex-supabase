# Video AI Implementation Recommendations

Reviewed source: `C:\Users\Kidsg\OneDrive\Desktop\Sixth Man\ai-video-analysis-feasibility-research.md.pdf`

## Recommendation

Use the document's recommended hybrid path: secure video upload in Sixth Man, queued server-side frame extraction, AI vision analysis, then coach review before stats or highlights are visible to parents.

This is the right first step because it keeps junior sport video inside the club-controlled Supabase project, costs less than commercial per-game products at club scale, and avoids over-investing in custom computer vision before the capture workflow is proven.

## What Is Implemented Now

- Supabase private buckets for `game-videos` and `video-recordings`.
- Typed video pipeline tables for recording sessions, uploaded recordings, queued jobs, detected events, stats, highlights, and reviews.
- RLS and storage guards that limit raw video to video staff roles and block client-written AI output rows.
- Coach/admin/team-manager video page at `/coach/videos`.
- Upload flow that creates a recording session, uploads raw video to private storage, creates recording metadata, and queues `transcode`, `vision_event_detection`, and `stat_extraction` jobs.
- Live Supabase QA users and seeded compatibility data for every app role.
- Live browser smoke test that signs in every role and verifies real private video upload/job queueing.

## Next Build Slice

1. Add a Supabase Edge Function or worker named `analyze-video-queue`.
2. Claim one queued job at a time using the service role.
3. Generate short-lived signed URLs for raw video.
4. Run FFmpeg in a worker environment to sample frames every 5 seconds for the first release.
5. Send batches to the selected vision model with game context, team colours, and jersey-number instructions.
6. Write AI outputs only from the worker into `video_events`, `game_video_stats`, and `video_highlights`.
7. Move sessions to `review` and require coach approval before parent/player visibility.

## AI Model Guidance

- Start with a low-cost vision model for event detection and a stronger model only for final summaries.
- Sample every 5 seconds first, then selectively increase around shot attempts, whistles, possession changes, and scoreboard changes.
- Treat jersey numbers as probabilistic labels, not identity proof.
- Do not use facial recognition.
- Store confidence, source model, and prompt version in each job/result record.

## Multi-Camera Plan

Phase 1 should stay single-upload. Phase 2 should add recording sessions with camera labels and audio sync. The current schema already supports this with `session_id`, `camera_role`, `camera_index`, and `sync_offset_ms`.

The first multi-camera UI should present switchable synced angles, not panoramic stitching. That gives coaches immediate value and avoids fragile computer-vision stitching issues in busy junior games.

## Privacy And Safeguarding

- Require club and guardian consent before upload.
- Keep raw video private and staff-only.
- Share only approved stats/highlights to parents and only where linked to their child.
- Define retention before launch: 90-180 days for raw video is a reasonable starting point.
- Use signed URLs for playback and processing; never public raw-video URLs.
- Keep all AI corrections in `video_analysis_reviews`.
