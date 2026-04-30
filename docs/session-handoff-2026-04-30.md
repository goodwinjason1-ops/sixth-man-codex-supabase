# Session Handoff - 2026-04-30

This file captures the key state a future Codex session should load before continuing work on the Sixth Man Supabase rebuild.

## Repo And Deployment

- Local repo: `C:\Users\Kidsg\OneDrive\Desktop\SIxth Man_Spud Rebuild_Supabase\sixth-man-codex-supabase`
- GitHub repo: `goodwinjason1-ops/sixth-man-codex-supabase`
- GitHub Pages app: https://goodwinjason1-ops.github.io/sixth-man-codex-supabase/
- Supabase project ref: `lipjgbcgwokhucbxinmn`
- Current pushed commit at last handoff: `1e63046` - `Start video AI outreach and adapter contract`

## Important Docs

- `docs/basketball-video-ai-provider-review.md`
- `docs/basketball-video-ai-provider-review.pdf`
- `docs/basketball-video-ai-costs-and-build-options.md`
- `docs/basketball-video-ai-costs-and-build-options.pdf`
- `docs/video-ai-provider-outreach.md`
- `docs/roboflow-open-source-video-ai-start.md`
- `docs/video-ai-worker.md`
- `docs/video-ai-implementation-recommendations.md`
- `docs/voice-transcription-edge-function.md`

## Google Drive Items

- Outreach hub Doc: https://docs.google.com/document/d/1MzAxJNs29bkP_tofHkX4cP9URNBljXjObOQSghC-a6E
- Provider response tracker Sheet: https://docs.google.com/spreadsheets/d/1YFQZEIg7D5maWssxCLqJOOOXFmokkx9xLy6SoGYyj0E
- Browser Use is still blocked by a local app-server path failure, so an actual Drive folder was not created through the UI. The Drive connector can create Docs/Sheets, but not a general Drive folder/upload in the currently exposed tools.

## Provider Outreach State

Gmail account visible to Codex: `goodwin.jason1@gmail.com`

Gmail drafts created but not sent:

- Kore Inside: draft `r-7603213221644260957`
- SportsVisio: draft `r5670788556586439546`
- PlaysWise: draft `r4103167719644147927`
- Hooper: draft `r-7708008965660980784`

Sending these drafts requires explicit confirmation from the user:

> Send the four provider outreach drafts from goodwin.jason1@gmail.com.

Superstat appears to require a web form:

- https://superstat.com.au/contact

The form message is recorded in `docs/video-ai-provider-outreach.md`.

## Video AI State

The app already has the right hook for a custom basketball video AI provider:

- `supabase/functions/video-job-worker/index.ts`
- `VIDEO_ANALYSIS_ENDPOINT`
- `VIDEO_ANALYSIS_TOKEN`

The worker sends a signed Supabase video URL plus job/session metadata to the endpoint. A Roboflow/open-source adapter should be an external service, not heavy inference inside a Supabase Edge Function.

Recent code change:

- `video-job-worker` now preserves custom provider/model metadata.
- It also preserves `needsReview`.
- Added `supabase/functions/video-job-worker/index.test.ts` for provider payload normalization.

Verification:

- `npm run build` passed.
- `deno test supabase/functions/video-job-worker/index.test.ts` could not run because `deno` is not installed in this shell.

Recommended next technical step:

1. Install or use Deno to run the Edge Function unit tests.
2. Add a minimal external adapter service skeleton for `POST /analyze`.
3. Return deterministic sample `events`/`stats` first.
4. Later wire in Roboflow/supervision/RF-DETR/OpenCV inference.

## Open-Source Build Recommendation

Primary safe building blocks:

- `roboflow/supervision` - MIT
- `roboflow/sports` - MIT, check separate model/data terms
- `roboflow/trackers` - Apache-2.0
- `roboflow/rf-detr` - Apache-2.0 for open components
- `FoundationVision/ByteTrack` - MIT
- CVAT - MIT
- Label Studio - Apache-2.0
- FiftyOne - Apache-2.0
- Datumaro - MIT

Use unclear/no-license basketball shot repos as inspiration only unless licensing is verified.

Avoid license traps:

- `ultralytics/ultralytics` is AGPL-3.0 unless using enterprise licensing.
- `mikel-brostrom/boxmot` is AGPL-3.0.

## Browser Use State

Browser Use initialized through the Node REPL, but navigation failed with:

- `failed to start codex app-server: The system cannot find the path specified. (os error 3)`

Do not rely on Browser Use until that plugin path issue is resolved.

## Current User Request In Progress

The latest active research request before this handoff:

> Research and report back on the offering from the top 15 major LLM labs (OpenAI, Anthropic, Google, AWS, xAI, DeepSeek, ByteDance, etc.) for the product that ElevenLabs provides. Produce a PDF report with a summary of offerings, comparison with cost as the primary determinant followed by independence from vendor lock-in.

Scope interpretation:

- Compare ElevenLabs-style voice AI: text-to-speech, voice cloning, dubbing, speech-to-speech, real-time voice agents.
- Providers should include major AI/LLM labs and hyperscalers where relevant.
- Cost is the primary ranking factor.
- Vendor independence / lock-in is the second ranking factor.
- Need current pricing, so web browsing is required.
- Output should be both markdown and PDF, likely under `docs/` and `output/pdf/`.

Research had just begun. Do not assume pricing from memory; verify current official pricing pages.

## Sensitive Data Notes

- Do not include or reveal Supabase service keys, HF tokens, QA passwords, or admin passwords in docs or responses.
- Sending Gmail drafts is external communication and needs explicit action-time confirmation.
- Uploading private footage or transmitting junior player data to vendors requires explicit confirmation and privacy review.
