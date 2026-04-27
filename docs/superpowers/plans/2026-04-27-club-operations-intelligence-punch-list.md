# Club Operations Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining club operations features in a safe order: selection governance, fair-play context, shot charts, committee report hardening, deployment, and live QA.

**Architecture:** Keep data-heavy logic in pure services with focused tests, then wire UI pages after service behavior is stable. Preserve role boundaries and parent-safe visibility at every step.

**Tech Stack:** React/Vite, Supabase documents compatibility layer, Supabase migrations/RLS, Playwright tests, GitHub Pages deployment.

---

## Punch List

### Completed

- [x] Harden IDP creation so shared plans include linked parent IDs.
- [x] Persist IDP reviews and update current goal/skill progress.
- [x] Add parent/player-safe IDP views that remove private coach notes.
- [x] Add Supabase parent-visible IDP read hardening and apply migration `202604260002` to project `lipjgbcgwokhucbxinmn`.
- [x] Add committee report pack data service and tests.
- [x] Add Committee Meeting Pack to Reports & Export with printable HTML/CSV output.

### In Progress

- [x] Add selection committee workflow foundation. Owner: Worker A / Euclid.
- [x] Add fair-play context fields and report-ready summaries. Owner: Worker B / Euler.
- [x] Add shot chart event model/service. Owner: Worker C / Anscombe.
- [x] Add first visible advanced analytics UI surface.
- [x] Add focused tests for the new services/workflows.
- [x] Run local role/admin/build verification after each slice.

### Remaining

- [ ] Wire committee report history/snapshot storage.
- [ ] Replace printable HTML with true PDF generation or stored signed report artifacts.
- [ ] Add movement-pattern analytics after video worker outputs are production-ready.
- [x] Push feature branch to GitHub.
- [x] Re-run deployed live QA once `LIVE_QA_PASSWORD` is available.
- [x] Deploy app code to GitHub Pages after live QA passes or after explicit release approval.

## Current Execution Notes

- Branch: `main`; feature PR #1 merged and deployed to GitHub Pages.
- 2026-04-27: three bounded workers started for selection governance, fair-play context, and shot-chart foundations. Main thread is coordinating integration and verification.
- 2026-04-27: fair-play context foundation added in `src/services/fairPlayService.js`; worker reported `npm test -- tests/fairPlayService.spec.js` passing with 5 tests.
- 2026-04-27: selection committee foundation added in `src/services/selectionCommitteeService.js`; worker reported `npm.cmd test -- tests/selectionCommitteeService.spec.js` passing with 3 tests.
- 2026-04-27: shot-chart analytics foundation added in `src/services/shotChartService.js`; worker reported `npm test -- tests/shotChartService.spec.js` passing with 3 tests.
- 2026-04-27: first Advanced Analytics admin surface added at `/admin/advanced-analytics` and linked from `/admin/analytics-hub`.
- 2026-04-27: focused service suite passed: `npx playwright test tests/selectionCommitteeService.spec.js tests/fairPlayService.spec.js tests/shotChartService.spec.js --project=chromium` with 11 tests.
- 2026-04-27: admin suite passed: `npx playwright test tests/admin.spec.js --project=chromium` with 9 tests.
- 2026-04-27: role smoke suite passed: `npx playwright test tests/role-smoke.spec.js --project=chromium` with 24 tests.
- 2026-04-27: production build passed: `npm run build`.
- 2026-04-27: deployed live QA passed after password was provided: `npm run qa:live:deployed` with 15 tests, including all role smoke checks and live coach video upload/queue.
- 2026-04-27: GitHub Pages deploy initially rendered blank because the artifact was built with root asset paths and without Vite Supabase env values. Added `build:pages`, made public links base-aware, rebuilt with the live Supabase URL/anon key, and deployed `gh-pages` commit `06a04a2`.
- 2026-04-27: post-deploy live QA passed: direct Playwright run against `https://goodwinjason1-ops.github.io/sixth-man-codex-supabase/` with 15/15 tests, including admin profile route coverage and live coach video upload/queue.
- Latest verified local checks before this punch list:
  - `npx playwright test tests/idpService.spec.js tests/committeeReportService.spec.js tests/idpParentVisibilityMigration.spec.js --project=chromium`
  - `npx playwright test tests/role-smoke.spec.js --project=chromium`
  - `npx playwright test tests/admin.spec.js --project=chromium`
  - `npm run build`
- Deployed live QA command used for final verification: `npx playwright test --config=playwright.live.config.js tests/live-supabase.spec.js --project=chromium --reporter=line`.
