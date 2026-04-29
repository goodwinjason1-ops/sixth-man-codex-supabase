# Basketball Video AI Provider Review

Research date: 2026-04-29

This review looks at providers that could power `VIDEO_ANALYSIS_ENDPOINT` for Sixth Man: a backend service that accepts a private Supabase signed video URL and returns structured basketball events, stats, timestamps, confidence scores, and review notes.

## What We Need

The app already has queueing, private storage, and worker orchestration. The missing piece is a basketball-specific analysis engine that can return data in a shape like:

```json
{
  "summary": "Detected shots, rebounds, turnovers, and player actions.",
  "events": [
    {
      "event_type": "made_3pt",
      "start_ms": 124000,
      "end_ms": 128000,
      "player_name": "Player 12",
      "team_id": "team-1",
      "confidence": 0.87,
      "court_position": { "x": 74, "y": 22 },
      "attributes": {
        "shot_type": "catch_and_shoot",
        "assisted": true,
        "source_clip_url": "..."
      }
    }
  ],
  "stats": [
    {
      "stat_type": "made_3pt",
      "stat_value": 1,
      "player_name": "Player 12",
      "confidence": 0.87
    }
  ]
}
```

Selection criteria:

- Basketball specificity: shots, makes/misses, assists, rebounds, turnovers, fouls, steals, blocks, screens, possessions, shot charts, player movement.
- Integration fit: API, webhook, export, or ability to build an adapter.
- Footage fit: phone video, single-camera gym footage, Hudl/Veo footage, broadcast, or fixed gym cameras.
- Youth sport privacy: data retention controls, security, DPA/contract terms, private processing.
- Cost and procurement fit for a club, not only professional leagues.
- Accuracy and review workflow: confidence values, clips linked to events, human review/correction path.

## Shortlist

| Provider | Type | Endpoint fit | Basketball depth | Procurement fit | Overall fit |
| --- | --- | --- | --- | --- | --- |
| Kore Inside | Basketball/soccer AI analytics engine | Medium-high, if they expose export/API/webhook | High | Potentially strong for club pilot | Best first pilot |
| PlaysWise | Basketball-first AI analytics | Medium, API claims but appears beta/waitlist | High | Good if beta access is real | Strong second pilot |
| Spiideo AutoData Basketball | Video platform plus professional basketball breakdown | Medium-low unless API/export is available | High | Strong if club accepts platform workflow | Best accuracy/reliability fallback |
| Sportradar Synergy Basketball API | Elite basketball data/video analytics API | Medium for covered competitions, low for our uploaded club footage | Very high | Likely expensive/contracted | Best enterprise data product, not first build choice |
| Pixellot/VidSwap | Automated production plus breakdown/API partner tools | Medium for partner integrations | Medium-high | Good if club wants cameras/platform | Hardware/platform route |
| Hudl/Instat/Assist/Sportscode | Established coaching video ecosystem | Low-medium; likely platform/export rather than direct endpoint | High | Good if already using Hudl | Useful adjacent workflow, not clean endpoint |
| HoopIQ, Superstat, Hooper | Basketball AI stats/highlights apps | Low-medium; validate API/export availability | Medium-high | Potentially affordable | Watchlist/pilot only |
| Roboflow custom CV stack | Build our own endpoint | High, because we own it | Medium initially, high after training | Engineering-heavy | Best long-term control |
| Twelve Labs | General video understanding API | High technically | Low-medium without basketball tuning | Developer-friendly | Good supporting tool, not primary stat engine |
| Google Video Intelligence / AWS Rekognition | Generic cloud video APIs | High technically | Low for basketball events | Easy procurement | Not recommended as primary |

## Provider Notes

### Kore Inside

Sources: [Kore Inside](https://koreinside.ai/)

Public claims:

- Basketball and soccer video AI engine.
- Processes broadcast, drone, Hudl, Veo, gym cam, or standard camera footage.
- Outputs stats, shot charts, tracking, events, and exports.
- Advertises basketball events such as shots, passes, screens, turnovers, rebounds, blocks, assists, and shot types.
- Advertises under 4 hour turnaround and low per-video pricing.

Strengths:

- Best alignment with our current architecture if their export/integration claim includes API or webhook access.
- Accepts the kind of footage the app expects: phone uploads, gym cameras, Hudl/Veo footage.
- Basketball event vocabulary appears close to our needs.
- Pricing appears club-friendly enough for a pilot.
- Could be wrapped behind `VIDEO_ANALYSIS_ENDPOINT` without changing the app if they can accept signed URLs or file upload jobs.

Weaknesses and risks:

- Public site does not show full API documentation or sample JSON.
- Accuracy claims need validation on junior/community basketball footage, not only polished clips.
- We need clarity on child/youth footage retention, model training use, deletion, data residency, and contract terms.
- If they only provide dashboard export rather than API/webhook, integration becomes manual.

Questions to ask:

- Can they accept a signed video URL by API and return structured JSON?
- Can they send a webhook when processing completes?
- Can they identify players by jersey number or uploaded roster?
- Can they return shot coordinates in court coordinates?
- Can they provide confidence scores and event clips?
- What is their youth data privacy policy and deletion SLA?

### PlaysWise

Sources: [PlaysWise](https://www.playswise.com/), [PlaysWise Basketball](https://www.playswise.com/sports/basketball)

Public claims:

- Basketball-specific analytics from any video source.
- Player tracking, ball tracking, event detection, shot charts, heat maps, play recognition, complete stats.
- Supports phone recordings, broadcast footage, and single camera setups.
- Mentions API integrations.

Strengths:

- Very strong basketball language: pick-and-rolls, fast breaks, isolations, shot charts, player tracking, complete game stats.
- Good fit for the app's likely footage sources.
- If API access is available, it could become a clean `VIDEO_ANALYSIS_ENDPOINT`.
- Basketball-first positioning may make coaching outputs easier to trust.

Weaknesses and risks:

- Site presents beta/waitlist language, so production readiness needs verification.
- Public information does not expose concrete API docs, pricing contract, data schema, or security documentation.
- Some public contact details look generic, so due diligence is needed before sharing club footage.

Questions to ask:

- Is the product live for external teams now, or still private beta?
- Can they process Australian junior club footage under a formal DPA?
- Can they return machine-readable event JSON, not just dashboard views?
- Can they map roster/player names from our app to detected jersey numbers?

### Spiideo AutoData Basketball

Sources: [Spiideo](https://www.spiideo.com/), [Spiideo AutoData Basketball](https://www.spiideo.com/autodata/autodata-basketball/), [AutoData support article](https://support.spiideo.com/en/articles/11206450-autodata-for-basketball), [Spiideo Basketball](https://www.spiideo.com/basketball-video-analysis-software/)

Public claims:

- Professional basketball breakdowns for team and player stats.
- Supports uploaded game video from Spiideo cameras and external cameras.
- Includes team/player stats, shooting, shot types, assists, turnovers, rebounds, fouls, steals, blocks, jump balls, shot panels, timelines, clips, and analytics.
- States access to data within 24 hours or less.

Strengths:

- Most reliable-looking club/practice pathway if the club is willing to use a platform workflow.
- Breakdown appears broad enough for committee reports, player development, and coach review.
- Human/professional breakdown workflow may be more accurate than fully automated AI for junior footage.
- Good if the club later wants gym cameras, capture reliability, and a full video operations platform.

Weaknesses and risks:

- The breakdown workflow may be ordered and reviewed inside Spiideo rather than returned directly to our app.
- 24 hour turnaround is fine for post-game review but not near-real-time game day feedback.
- Pricing likely requires sales conversation.
- Integration may require CSV/export or partner API, not a simple public API.

Questions to ask:

- Do they offer API export or webhook access for AutoData Basketball?
- Can they process videos uploaded from our Supabase Storage without moving users into Spiideo first?
- Can event data be exported with timestamps and player identifiers?
- What is the minimum subscription or per-game cost?

### Sportradar Synergy Basketball API

Sources: [Synergy Basketball API release](https://developer.sportradar.com/sportradar-updates/changelog/synergy-basketball-api-release), [advanced endpoint package](https://developer.sportradar.com/sportradar-updates/changelog/synergy-basketball-api-advanced-endpoint-package), [Sportradar/Synergy acquisition](https://investors.sportradar.com/news-releases/news-release-details/sportradar-acquires-synergy-sports), [Synergy high school](https://sportradar.com/synergy-basketball-for-high-school/?lang=en-us), [Synergy app overview](https://support.synergysports.com/support/solutions/articles/77000565967-overview)

Public claims:

- Rich structured data on every possession, play types, lineups, defensive matchups, shot coordinates, and advanced metrics.
- APIs cover NBA, WNBA, G League, NCAA D1, and international competitions.
- Synergy is a long-standing basketball video and analytics standard.
- High school product includes video breakdown, sharing, advanced analytics in higher bundles.

Strengths:

- Deepest basketball-specific data product in this review.
- Programmatic API exists for covered competitions.
- Strong event taxonomy and analytics credibility.
- Good benchmark for the schema our app should aspire to.

Weaknesses and risks:

- API appears focused on competitions Synergy covers, not necessarily processing arbitrary uploaded junior club footage.
- Likely enterprise pricing and licensing.
- May not fit a club-owned `VIDEO_ANALYSIS_ENDPOINT` unless we become a customer with upload/breakdown/export rights.

Questions to ask:

- Can Synergy process Emerald Lakers uploaded footage, or only provide data for covered competitions?
- Is high school video breakdown available in Australia?
- Can we receive breakdown data through API/export for our own app?
- What are the licensing restrictions on storing derived stats in Supabase?

### Pixellot / VidSwap

Sources: [Pixellot](https://www.pixellot.tv/), [Pixellot API knowledge base](https://docs.pixellot.tv/portal/en/kb/pixellot-you/api-knowledge-base), [Advanced Breakdown API article](https://docs.pixellot.tv/portal/en/kb/articles/api-advanced-breakdown)

Public claims:

- Automated multi-camera sports production, highlights, streaming, and VidSwap data/analytics.
- API knowledge base includes partner API and advanced breakdown integration material.
- Large installed base across schools, clubs, federations, and broadcasters.

Strengths:

- Strong if the club wants automated capture and a broader video operations platform.
- API/partner integration exists in some form.
- Pixellot/VidSwap may fit clubs and schools better than pro-only systems.

Weaknesses and risks:

- Public docs are partner-oriented and do not reveal detailed basketball event schema.
- May require Pixellot hardware/platform adoption.
- More of an ecosystem decision than a simple endpoint provider.

Questions to ask:

- Does Advanced Breakdown support basketball event/stat export with timestamps?
- Can they process externally uploaded Supabase videos?
- Is API access available to a single club app, or only platform partners?

### Hudl / Instat / Assist / Sportscode

Sources: [Hudl Basketball](https://www.hudl.com/sports/basketball), [Hudl products](https://api.hudl.com/products), [Hudl Instat](https://api.hudl.com/products/instat)

Public claims:

- Basketball capture, analysis, sharing, Assist breakdown, Sportscode workflows, Instat statistics/scouting, shot charts and performance reporting.
- Supports club through professional levels.

Strengths:

- Highly credible coaching video platform.
- Excellent if coaches already use Hudl and want familiar workflows.
- Assist/Instat can supply reports and breakdowns without building our own CV system.

Weaknesses and risks:

- Public-facing materials do not show a simple basketball event extraction API for arbitrary app uploads.
- Strong platform lock-in risk.
- May be better as an import/export companion than the app's internal AI endpoint.

Questions to ask:

- Can Hudl export Assist/Instat breakdowns via API or scheduled export?
- Can our app ingest Hudl-produced data with player, timestamp, shot chart, and event fields?
- What are the terms for storing derived breakdown data in our own Supabase database?

### HoopIQ, Superstat, Hooper

Sources: [HoopIQ](https://hoopiq.ai/), [HoopIQ technology](https://hoopiq.ai/tech), [Superstat](https://www.superstatsport.com/), [Hooper](https://www.hooper.gg/)

Public claims:

- AI basketball stats and highlights from uploaded game footage or phone capture.
- HoopIQ mentions automatic tagging for shots, dribbles, movement, box scores, shot charts, and highlights.
- Superstat advertises AI stats/highlights and average accuracy/turnaround claims.
- Hooper focuses more on players, stats, shot-by-shot analytics, and highlights from phone video.

Strengths:

- Potentially affordable and youth/player-friendly.
- Good user experience inspiration.
- Could be useful for individual development and highlight workflows.

Weaknesses and risks:

- Public sites do not clearly expose API/webhook integration.
- Some are consumer/player products rather than club operations platforms.
- Need strong privacy diligence before using junior footage.

Recommendation:

- Keep on watchlist.
- Contact only after Kore, PlaysWise, and Spiideo because endpoint suitability is less clear.

### Roboflow Custom CV Stack

Sources: [Roboflow basketball player detection template](https://templates.roboflow.com/basketball-player-detection), [Roboflow basketball tracking article](https://blog.roboflow.com/identify-basketball-players/), [Roboflow basketball detections model](https://universe.roboflow.com/firsttime/basketball-game-detections/model/9), [Roboflow features](https://roboflow.com/features)

Public claims and evidence:

- Roboflow supports dataset management, video frame extraction, model training, hosted inference, and edge deployment.
- Public basketball models/templates exist for players, ball, rim, made shots, and other basketball detections.
- Roboflow's basketball article outlines a pipeline using object detection, segmentation/tracking, jersey number recognition, court mapping, and shot event classification.

Strengths:

- Best long-term control over schema, privacy, provider lock-in, and app integration.
- We can implement exactly the `VIDEO_ANALYSIS_ENDPOINT` contract we want.
- Good for staged capabilities: shot charts first, then player tracking, then possessions/actions.
- Can keep all derived data inside our Supabase schema.

Weaknesses and risks:

- Not a plug-and-play answer.
- Requires labelled footage, model training, validation, GPU/compute costs, and ongoing QA.
- Basketball is visually hard: player overlap, motion blur, jersey reading, camera movement, occlusions, small ball, and changing lighting.
- A reliable full-stat engine would take iterative development, not days.

Best use:

- Build a prototype endpoint for narrow tasks, especially shot/rim/ball/player detection and shot chart estimation.
- Use human review in the app until model confidence is proven.

### Twelve Labs

Sources: [Twelve Labs](https://www.twelvelabs.io/), [Twelve Labs API docs](https://twelve-labs-api-doc.readme.io/)

Public claims:

- Video-native perception, reasoning, search, summarization, and multimodal API.
- Can index video and reason across visual, audio, and speech content.

Strengths:

- Developer-friendly API route.
- Strong for searching film, summarising coach-review clips, and asking natural language questions about video.
- Useful as a companion to structured event data.

Weaknesses and risks:

- Not basketball-specific by default.
- Likely weaker than a dedicated basketball engine for precise box-score stats, shot outcomes, player identity, and court coordinates.
- May hallucinate or overgeneralize if used as the only source of record.

Best use:

- Secondary layer for natural-language search, summary, and coach-review assistance after structured events exist.

### Google Video Intelligence and AWS Rekognition

Sources: [Google Video Intelligence object tracking](https://cloud.google.com/video-intelligence/docs/object-tracking), [AWS Rekognition Video](https://docs.aws.amazon.com/rekognition/latest/dg/video.html), [AWS Rekognition API flow](https://docs.aws.amazon.com/rekognition/latest/dg/api-video.html)

Public claims:

- Google can track generic detected objects with labels and bounding boxes.
- AWS Rekognition Video can detect labels, people, faces, and other generic objects/asynchronous results.

Strengths:

- Mature cloud APIs with solid operational reliability.
- Easy to integrate into backend workflows.
- Useful for generic person/object detection, moderation, and metadata extraction.

Weaknesses and risks:

- Not basketball-specific.
- Will not reliably produce possessions, assists, rebounds, made/missed shots, screens, defensive events, or player-specific box scores.
- Could create a false sense of automation while still requiring heavy custom logic.

Recommendation:

- Do not use as the primary basketball analytics engine.
- Consider only as supporting infrastructure if a custom model path needs generic object/person metadata.

## Recommendation

### Recommended path: two-track pilot

1. Run a 2-provider pilot with Kore Inside and PlaysWise.
2. In parallel, scope a narrow custom Roboflow-based prototype for shot/rim/player/ball detection on our own footage.
3. Keep Spiideo AutoData as the reliability fallback if fully automated providers cannot deliver trustworthy data.

### Why Kore Inside is my first-contact recommendation

Kore appears to be the best first contact because it has the strongest match to our current app architecture:

- It advertises processing from any standard footage source, including Hudl, Veo, gym cameras, broadcast, drone, and standard camera video.
- It explicitly advertises basketball tracking, events, shot charts, player metrics, exports, and integrations.
- The turnaround and pricing claims look more club-friendly than enterprise systems.
- It is the most likely to become a backend adapter behind `VIDEO_ANALYSIS_ENDPOINT` without requiring hardware, full platform migration, or a professional-league data license.

I would not sign a contract until they provide:

- Sample API request/response.
- Sample basketball JSON output from a real full game.
- A data-processing agreement suitable for junior sport footage.
- A deletion/retention policy.
- A pilot on at least two Emerald Lakers-style videos.
- Accuracy report by event type.
- Confirmation that outputs can be stored in Supabase.

### Why PlaysWise should be second in the same pilot

PlaysWise may have the best basketball-specific product language in the shortlist. It directly mentions play recognition, phone recordings, shot charts, player tracking, ball tracking, complete game stats, and API integrations. The reason it is second rather than first is the public beta/waitlist positioning and lack of visible technical docs. If they are production-ready and can show a working API, they could overtake Kore.

### Why Spiideo is the fallback

Spiideo AutoData looks more mature operationally for clubs and schools, and its basketball breakdown list is broad and practical. It may be the better choice if the club values accurate reviewable stats over immediate API automation. The likely downside is integration: the app may need to import exported breakdown data instead of sending a video to a simple endpoint and receiving JSON.

### Why not Synergy/Second Spectrum/Hudl first

These are highly credible basketball ecosystems, but they are not the cleanest first move for this app:

- Synergy/Sportradar has excellent basketball data APIs, but they appear tied to covered competitions and enterprise licensing rather than arbitrary junior club uploads.
- Second Spectrum/Genius is elite tracking technology, but it is likely pro/league-level procurement and not a practical club endpoint.
- Hudl is excellent for coaching workflows, but public materials do not show a direct event extraction API for our uploaded videos.

They are worth contacting if the club already uses or plans to buy those ecosystems, but they are not the fastest path to a working `VIDEO_ANALYSIS_ENDPOINT`.

## Pilot Design

Use the same footage and scoring sheet across providers:

- 2 full games: one clean sideline recording and one phone/gym recording.
- 1 training drill video.
- Manual ground truth entered by a coach or scorer for shots, makes/misses, turnovers, fouls, rebounds, assists, steals, blocks, and player numbers.
- Require provider output as JSON/CSV with timestamps, event type, player/team, confidence, and clip links.

Success gates:

- At least 90 percent precision on made/missed shots and player attribution before using results in reports.
- At least 80 percent useful coverage for rebounds/turnovers/assists before showing those to parents or committees.
- All AI-derived outputs must stay in staff review state until a coach approves them.
- Provider must support deletion of original video and derived data on request.

## Integration Contract To Request

Ask each provider whether they can support this flow:

1. Sixth Man creates a signed Supabase video URL.
2. Sixth Man sends a POST request to the provider:

```json
{
  "jobId": "uuid",
  "videoUrl": "signed-url",
  "callbackUrl": "https://lipjgbcgwokhucbxinmn.supabase.co/functions/v1/video-provider-callback",
  "sport": "basketball",
  "sourceType": "game",
  "team": {
    "id": "team-1",
    "name": "U12 Boys Green",
    "roster": [
      { "id": "player-1", "name": "Player One", "number": "12" }
    ]
  },
  "requiredOutputs": [
    "events",
    "shot_chart",
    "box_score",
    "player_tracking",
    "clips"
  ]
}
```

3. Provider either returns completed JSON or calls our webhook when ready.
4. Sixth Man stores all outputs as `needs_review`.
5. Coach/admin approves, corrects, or rejects results.

## Decision Checklist

Before choosing any provider:

- Does the provider support API or webhook access?
- Does the provider provide sample JSON with timestamps, confidence, and player identity?
- Does the provider accept signed URLs, or must we upload into their system?
- Can they handle single-camera junior footage?
- Can they identify players from jersey number and roster upload?
- Can they return shot coordinates and possession events?
- Are child/youth data controls contractually clear?
- Can outputs be stored in Supabase and shown in our app?
- What is the per-game price at club volume?
- What is the real turnaround time for full games?

## My Bottom Line

Start with Kore Inside and PlaysWise as the fastest route to a true `VIDEO_ANALYSIS_ENDPOINT`. Make the pilot evidence-driven and require real JSON outputs before committing.

If those providers cannot expose an API/webhook with usable event data, use Spiideo AutoData as the practical short-term operations tool and import/export its breakdowns.

In parallel, build a small custom Roboflow prototype for one narrow, high-value capability: shot chart extraction from uploaded footage. That gives Sixth Man a strategic fallback and avoids being permanently dependent on one vendor.
