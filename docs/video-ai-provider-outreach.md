# Video AI Provider Outreach

Date: 2026-04-30

This document tracks the first provider outreach round for the Sixth Man basketball video AI pilot.

## Outreach Goals

- Validate which providers can give Sixth Man API, webhook, CSV, or JSON access.
- Confirm pricing for 3 teams and about 60 games in a season.
- Confirm youth/minor privacy terms, deletion rights, data retention, and whether videos are used for model training.
- Find out which providers can support a small 3-5 game pilot before a season commitment.
- Keep low-cost options in scope, especially Superstat and Hooper.

## Providers

| Provider | Contact route | Status | Why contact |
| --- | --- | --- | --- |
| Kore Inside | `shubham@koreinside.ai` | Gmail draft created | Best apparent backend/API candidate. Public site mentions exports, integrations, events, tracking, and any standard video source. |
| SportsVisio | `sales@sportsvisio.com`, `customersuccess@sportsvisio.com` | Gmail draft created | Strong basketball product with stats, highlights, shot charts, and coach mode. Export/API access needs confirmation. |
| Superstat | https://superstat.com.au/contact | Web form required | Very strong low-cost Australian-facing option. Need to confirm export/API access and youth privacy terms. |
| PlaysWise | `hello@playswise.ai` | Gmail draft created | Strong basketball-first positioning and API/integration claims, but availability/pricing needs validation. |
| Hooper | `team@hooper.gg` | Gmail draft created | Important low-cost wildcard. Need to ask about club scale, partner/API/export access, full-court workflow, and privacy terms. |

## Gmail Drafts Created

Drafts were created in the connected Gmail account visible to Codex: `goodwin.jason1@gmail.com`.

They are not sent yet. Sending requires final user confirmation because it is external communication.

Draft IDs:

- Kore Inside: `r-7603213221644260957`
- SportsVisio: `r5670788556586439546`
- PlaysWise: `r4103167719644147927`
- Hooper: `r-7708008965660980784`

Required send confirmation:

> Send the four provider outreach drafts from goodwin.jason1@gmail.com.

## Superstat Web Form Message

Superstat did not have a public email in the first research pass. Use this message in their contact form:

```text
Hi Superstat team,

I am evaluating basketball video AI options for Sixth Man, a coaching and club operations app being rebuilt on Supabase for a junior basketball program.

Superstat is one of the strongest low-cost options we have found, especially for Australian junior basketball. We are considering a 3-team pilot of approximately 60 games in a season.

Could you please confirm whether Superstat supports API access, scheduled CSV/JSON export, or any bulk export of processed game results? We are looking to map game ID, team/player IDs, box score, play-by-play/events, shot chart coordinates, clip URLs, processing status, and stat corrections back into our own Supabase app.

Could you also confirm all-in pricing for 3 teams and 60 games, whether games can be pooled across teams, and youth/minor privacy terms including parent/guardian controls, private teams by default, deletion requests, data retention, model-training opt-in/opt-out, DPA availability, and data hosting location?

We would also be interested in a small paid pilot with 3-5 junior basketball games before committing to a season.

Kind regards,
Jason Goodwin
```

## Core Questions

Ask every provider:

- Do you offer API access, scheduled CSV/JSON export, or webhooks when a game finishes processing?
- Can we receive game ID, team/player IDs, box score, play-by-play/events, shot chart coordinates, clip URLs, full-game video URL, processing status, and stat corrections?
- Can our app upload video programmatically, or must uploads happen manually in your dashboard/app?
- For 3 teams and 60 games, what is the all-in price including storage, users, exports/API, support, and overage fees?
- Can the 60 games be pooled across teams, or is pricing locked per team?
- What turnaround SLA should we expect for youth basketball games?
- For minors/youth: do you support parental consent, private teams by default, deletion requests, data retention controls, and no model training on our videos unless opted in?
- Can we sign a DPA or data processing addendum, and where is data hosted?
- Can exported data map to our existing Sixth Man/Supabase entities: teams, players, games, periods, events, clips?
- Can we run a paid pilot with 3-5 sample games before committing?

## Drive Hub

A Google Drive document was created because the Drive connector supports native Docs but not folder creation/upload in this session, and Browser Use is still blocked by its local app-server path issue.

Drive hub:

https://docs.google.com/document/d/1MzAxJNs29bkP_tofHkX4cP9URNBljXjObOQSghC-a6E

Provider response tracker:

https://docs.google.com/spreadsheets/d/1YFQZEIg7D5maWssxCLqJOOOXFmokkx9xLy6SoGYyj0E

The hub document contains the provider list, questions, response tracker, and local report references. It can be moved into an actual Drive folder once Drive UI automation is working or manually by the user.
