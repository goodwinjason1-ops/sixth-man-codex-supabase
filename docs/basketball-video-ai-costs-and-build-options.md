# Basketball Video AI Costs and Build Options

Research date: 2026-04-29

This is a companion to `docs/basketball-video-ai-provider-review.md`. It estimates what a three-team season could cost across the providers in the review and captures open-source/GitHub options that could help Sixth Man build its own basketball video analysis pipeline over time.

## Assumptions

Pricing is inconsistent across vendors, so these estimates use a clear baseline:

- Club scope: 3 teams.
- Baseline season: 20 games per team, or 60 full game videos.
- Average game video length: 75 minutes.
- Baseline video volume: 4,500 minutes, or 75 video hours.
- Training footage is excluded unless noted.
- USD to AUD conversion: approximately 1 USD = 1.39 AUD based on current public exchange-rate snapshots. Treat AUD conversions as budgeting estimates only.
- Public prices are marked as public. Hidden/vendor-quote pricing is marked as planning allowance, not a quote.

For a shorter 14-game season, multiply per-game estimates by 42 games instead of 60 games.

## Three-Team Season Estimate

| Provider / path | Public pricing evidence | Estimated three-team season cost | Confidence | Notes |
| --- | --- | ---: | --- | --- |
| Superstat | Public Australia pricing: AUD $230 season pass for 20 games, AUD $15 single game, AUD $65 for 5 games | About AUD $690 for 60 games | High for published package | Very strong low-cost benchmark. It is basketball-specific and Australian-facing. Main question is API/export access into Sixth Man. |
| Kore Inside | Public club pack: USD $25/team/video | USD $1,500, about AUD $2,085 | High for published per-video price | Best current API-style pilot candidate if they can provide JSON/webhook output. 42-game season would be USD $1,050. |
| SportsVisio | Public references: USD $34/game, Coach Mode USD $600 promo / $750 list for 20-game pack, USD $199/month single-team unlimited games | USD $1,800-$2,250 for 60 games via three 20-game packs; USD $2,040 pay-as-you-go; USD $3,582 for 3 teams over 6 months at $199/team/month | Medium-high | Strong basketball-specific product with stats, highlights, shot charts and coach insights. Needs export/API validation. |
| Hudl + Hudl Assist | Hudl club basketball: Bronze USD $400/team/year, Silver USD $1,000, Gold USD $1,600. Assist basketball: USD $900-$2,100/team/season | Hudl platform only: USD $1,200-$4,800. Platform plus standard Assist: about USD $3,900-$7,500. Upper Assist bundle: up to about USD $11,100 | High for public Hudl prices | Excellent coaching workflow, but not a clean `VIDEO_ANALYSIS_ENDPOINT` unless exports/API can be arranged. |
| Hooper | Public paid tier: USD $11.99/month, 30 recording hours/month | Roughly USD $72 for one shared account over 6 months, or USD $216 for one account per team over 6 months | Medium | Very cheap, but consumer/player app fit. Full-court can require two phones/accounts. API/export unclear. |
| HoopIQ | Public beta: all plans currently free; listed future Pro USD $29/month and League USD $99/month | During beta: USD $0. Future planning: USD $174-$594 for 6 months if one club account; up to USD $522 if Pro is per team | Medium | Appears promising, but beta status and API/export readiness need due diligence. |
| Statcut | Public waitlist pricing: Player USD $12/month, Pro Athlete USD $79/month, Coach USD $150/month with 50 uploads and 12 player seats | USD $900 for one Coach plan over 6 months; up to USD $2,700 if one Coach plan is needed per team | Medium-low | Interesting feature inspiration, but it is not yet a proven production integration path. |
| PlaysWise | No public price found; beta/waitlist language and API claims | Planning allowance only: USD $1,500-$4,500 if priced around Kore/SportsVisio-style per-video economics | Low | Good basketball claims, but pricing and production availability must be confirmed before budgeting. |
| Spiideo AutoData Basketball | Publicly says "Talk to sales"; AutoData uses tokens and 24h professional breakdown workflow | Planning allowance only: USD $2,400-$9,000+ for 60 games if breakdown costs land around USD $40-$150/game, plus platform/camera costs if required | Low | Reliability fallback rather than first endpoint choice. Needs API/export and token pricing from sales. |
| Pixellot / VidSwap | Pixellot Air NXT retail references around USD $949; platform and breakdown pricing mostly sales-led | Hardware starting around USD $949 if buying portable camera; planning allowance USD $2,000-$8,000+ for service/breakdowns | Low-medium | Hardware/platform route. Useful if the club wants capture automation, not just AI analysis. |
| Sportradar Synergy | High school product is 12-month non-prorated contract; API and player tracking are sales-led | Planning allowance only: likely several thousand USD minimum; API/pro data use could be USD $10k-$50k+ | Low | Best basketball taxonomy benchmark, but probably not a practical first club integration. |
| Roboflow custom CV stack | Core plan USD $99/month monthly or USD $79/month annual; credits/usage vary; open-source tools available | Runtime/platform planning: USD $600-$2,500/season. Initial build, labelled data and validation: likely USD $20k-$60k+ equivalent effort | Medium | Best long-term control. Not a plug-and-play replacement for a vendor in the short term. |
| Twelve Labs | Developer pricing: indexing USD $0.042/min, Pegasus analyze input USD $0.0292/min, infrastructure USD $0.0015/min/month | About USD $320-$400 for 4,500 minutes if indexing plus analysis is used, before heavy query/output usage | High for API pricing, low for basketball stat value | Strong for video search/summarisation. Not basketball-specific enough to be the source of record. |
| Google Video Intelligence | Stored video: label USD $0.10/min, object tracking USD $0.15/min, person detection USD $0.10/min, first 1,000 min/month free per feature | From near USD $0 if spread under free monthly limits for simple features, up to about USD $1,225 for label+object+person in one processing month after free tier | Medium | Generic metadata only. Not recommended as primary basketball analytics. |
| AWS Rekognition Video | Stored video examples: label USD $0.10/min, shot detection USD $0.05/min; free tier includes 60 minutes/month for 12 months | About USD $675 for label+shot detection over 4,500 minutes before small free-tier offsets; more if adding extra APIs | Medium | Generic video metadata only. Useful support tool, not full basketball analysis. |

## What The Costs Mean

The cheapest basketball-specific options are Superstat, Hooper, HoopIQ beta, and SportsVisio. They may be excellent for a club workflow, but their fit depends on whether they can export data in a format Sixth Man can ingest.

The strongest endpoint-style pilot remains Kore because its public positioning most closely matches the app's backend architecture: upload video, process it, return/export structured basketball metrics. It is not the cheapest option, but USD $1,500 for a 60-game pilot season is still club-friendly if the integration works.

Hudl, Spiideo, Pixellot and Synergy are credible sports operations products, but they are more likely to pull the club into their platform rather than act as a simple backend provider behind Sixth Man.

Twelve Labs, Google and AWS are developer-friendly but generic. They can help with search, summaries, metadata, moderation, and maybe clip review, but they should not be treated as the official source for made shots, assists, rebounds, turnovers, fouls, player identity, or shot location.

## GitHub And Open-Source Options

These are the most useful public projects found for a build-it-ourselves pathway.

| Project | Stars / license found | Useful for Sixth Man | Cautions |
| --- | ---: | --- | --- |
| [roboflow/sports](https://github.com/roboflow/sports) | About 4.9k stars, MIT | Best starting point. Sports CV toolkit with basketball court keypoint detection, basketball jersey OCR references, ball tracking, player tracking and camera calibration concepts. | Examples are not a complete basketball stats engine. We still need our own training data and QA. |
| [roboflow/supervision](https://github.com/roboflow/supervision) | About 38k stars, MIT | Production-friendly utilities for detections, tracking, zones, annotation, datasets and video processing. Good glue code for our pipeline. | It is infrastructure, not a trained basketball model. |
| [roboflow/trackers](https://github.com/roboflow) | About 3.3k stars, Apache-2.0 via Roboflow org listing | Clean multi-object tracking components that can pair with any detector. | Need benchmark on basketball occlusions and camera movement. |
| [FoundationVision/ByteTrack](https://github.com/FoundationVision/ByteTrack) | About 6.3k stars, MIT | Mature multi-object tracking algorithm; useful for player/ball persistence across frames. | Original repo may need wrapping/modernization; tracking alone does not identify players. |
| [mikel-brostrom/boxmot](https://github.com/mikel-brostrom/boxmot) | About 7.9k stars, AGPL-3.0 | Strong tracker comparison and pluggable MOT options such as BoT-SORT, ByteTrack, StrongSORT and OCSORT. | AGPL license is restrictive for proprietary deployment unless we comply or obtain suitable licensing. |
| [ultralytics/ultralytics](https://github.com/ultralytics/ultralytics) | About 56k stars, AGPL-3.0 / enterprise license | Fast object detection, segmentation, pose and tracking workflows. Useful for prototypes and training. | Commercial/proprietary use needs careful AGPL compliance or enterprise license. |
| [avishah3/AI-Basketball-Shot-Detection-Tracker](https://github.com/avishah3/AI-Basketball-Shot-Detection-Tracker) | 244 stars, no license shown in search result | Useful concept reference for real-time shot detection and make/miss tracking. | No clear license found; use for inspiration, not copied production code. |
| [chonyy/basketball-shot-detection](https://github.com/chonyy/basketball-shot-detection) | 139 stars, no license shown in search result | Useful reference for shot judgement and shooting pose analysis. | Older/prototype-style project; license unclear. |
| [browlm13/Basketball-Shot-Detection](https://github.com/browlm13/Basketball-Shot-Detection) | 96 stars, no license shown in search result | Additional shot detection reference. | Needs code review before reuse; license unclear. |
| [josephattalla/Basketball-Shot-Detection](https://github.com/josephattalla/Basketball-Shot-Detection) | 5 stars, MIT | YOLOv8/OpenCV make/miss/shooting percentage reference with permissive license. | Small repo; likely not production-grade. |
| [sketscripter/Computer-vision-basketball-court-mapping-and-player-tracking](https://github.com/sketscripter/Computer-vision-basketball-court-mapping-and-player-tracking) | Apache-2.0 | Court mapping, homography, colour detection and player-tracking concept work. Useful for movement/shot chart prototype. | Older project; likely needs modernization. |
| [sportvision](https://pypi.org/project/sportvision/) | Apache-2.0 PyPI package | Sports analytics toolkit using Roboflow, YOLO-compatible models, ByteTrack, team colour classification, possession, speed, distance and heatmaps. | Appears soccer/generic-oriented; validate maturity before depending on it. |
| [wunderscout](https://pypi.org/project/wunderscout/) | PyPI package | YOLO, embeddings, homography, player/ball tracking and CSV export concepts. | Soccer-oriented; useful architecture inspiration more than direct basketball logic. |

## Recommended Build-It-Ourselves Architecture

The realistic in-house build is staged, not all-at-once.

### Stage 1: Reviewable Shot Chart MVP

Goal: produce shot events, make/miss candidates, rough court coordinates and clips for coach approval.

Components:

- Detector: RF-DETR, YOLO, or Roboflow-trained model for ball, hoop/rim, players and court keypoints.
- Tracker: ByteTrack or Roboflow Trackers for player/ball continuity.
- Court mapping: keypoint homography to map image positions onto a 2D court.
- Event logic: shot attempt detection based on ball trajectory, rim proximity, arc and post-shot outcome.
- Human review: every AI event enters `needs_review` before it affects reports.

Why this first:

- Shot charts are high value for coaches and committees.
- The event set is narrower than full box-score automation.
- It can be validated with manual scoring.
- It maps cleanly to the existing `video_analysis_jobs` and `video_analysis_results` flow.

### Stage 2: Player Identity And Roster Matching

Goal: attach likely player names/numbers to reviewed events.

Components:

- Jersey OCR model.
- Roster-number hints from Sixth Man.
- Manual correction UI: "AI thinks this is #12 Jason Goodwin. Confirm/change."
- Confidence thresholds and audit history.

This should not be skipped. Basketball stats become politically sensitive fast if a player is credited incorrectly.

### Stage 3: Expanded Events

Goal: add rebounds, assists, steals, turnovers, blocks and fouls.

Components:

- Possession model.
- Sequence/event classifier.
- Ball/player interaction features.
- Optional audio/scoreboard cues.
- Coach review workflow by event type.

This is the hardest stage. Assists, fouls and turnovers are contextual, and junior footage can be messy.

### Stage 4: Movement And Development Analytics

Goal: heatmaps, spacing, movement trends, player workload proxies and team style trends.

Components:

- Player tracks mapped to court coordinates.
- Team clustering/jersey colour classification.
- Speed/distance approximations.
- Lineup and rotation joins from the app's existing game records.
- Trend views for player development plans and committee reports.

## Recommendation

For the next practical step, I would do three things in parallel:

1. Contact Kore, Superstat and SportsVisio for export/API samples using the same two Emerald Lakers-style videos.
2. Treat Superstat and SportsVisio as the price/performance benchmarks, even if they are not clean API providers.
3. Start a small Roboflow/open-source prototype for shot charts only, not full stats.

My current preferred decision path:

- If Kore can provide clean JSON/webhooks and passes privacy review, pilot Kore as the first `VIDEO_ANALYSIS_ENDPOINT`.
- If Kore cannot provide integration-quality output, use Superstat or SportsVisio operationally while importing CSV/manual exports into Sixth Man.
- Keep building the in-house shot chart prototype so the club is not permanently locked into any vendor.

## Provider Questions To Ask Next

For Kore, Superstat, SportsVisio and PlaysWise:

- Can you accept a signed Supabase video URL, or do we need to upload into your platform?
- Can you return JSON or CSV with timestamps, event type, player number/name, shot location and confidence?
- Can a webhook notify our Supabase Edge Function when processing is complete?
- Can we store derived event and stat data in our own Supabase database?
- Can coaches correct events, and can those corrections be exported?
- What is the exact price for 3 teams, 20 games per team, with no lock-in beyond one season?
- What are retention, deletion, model-training and child/youth footage policies?

For Roboflow/custom build:

- How many club videos can we label for a first dataset?
- Can we get permission to use test footage for model development?
- What frame sampling rate is enough for shot detection?
- Which stats must be 95 percent accurate before parents or committees see them?
- Which stats can remain coach-only while still experimental?

## Sources

- Kore Inside: https://koreinside.ai/
- Superstat Australia: https://superstat.com.au/
- Superstat global: https://www.superstatsport.com/
- SportsVisio pricing stories and Coach Mode pages: https://www.sportsvisio.com/stories/cost-of-sportsvisio and https://www.sportsvisio.ai/
- Hudl club basketball pricing: https://www.hudl.com/pricing/club/basketball
- Hudl Assist basketball pricing: https://www.hudl.com/pricing/club/assist/basketball
- Hooper pricing: https://www.hooper.gg/pricing
- HoopIQ pricing: https://hoopiq.ai/pricing
- Statcut pricing: https://statcut.com/
- Spiideo AutoData Basketball: https://www.spiideo.com/autodata/autodata-basketball/
- Pixellot Air NXT and VidSwap: https://www.pixellot.tv/products/pixellot-air/ and https://www.pixellot.tv/products/vidswap/
- Sportradar Synergy high school: https://sportradar.com/synergy-basketball-for-high-school/?lang=en-us
- Roboflow pricing: https://roboflow.com/pricing
- Twelve Labs pricing: https://www.twelvelabs.io/pricing
- Google Video Intelligence pricing: https://cloud.google.com/video-intelligence/pricing
- AWS Rekognition pricing: https://aws.amazon.com/rekognition/pricing/
- Roboflow sports: https://github.com/roboflow/sports
- Roboflow Supervision: https://github.com/roboflow/supervision
- ByteTrack: https://github.com/FoundationVision/ByteTrack
- BoxMOT: https://github.com/mikel-brostrom/boxmot
- Ultralytics YOLO: https://github.com/ultralytics/ultralytics
- Basketball shot detection references: https://github.com/avishah3/AI-Basketball-Shot-Detection-Tracker, https://github.com/chonyy/basketball-shot-detection, https://github.com/josephattalla/Basketball-Shot-Detection
- Basketball court/player mapping reference: https://github.com/sketscripter/Computer-vision-basketball-court-mapping-and-player-tracking
- SportVision: https://pypi.org/project/sportvision/
- Wunderscout: https://pypi.org/project/wunderscout/
