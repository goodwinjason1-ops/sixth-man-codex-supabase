# QA Role Smoke Report

Date: 2026-04-25

Scope:
- Active Playwright smoke coverage for admin, president, vice president, coach coordinator, girls coordinator, boys coordinator, youth head coach, youth coach, coach, team manager, parent, player, tryout assessor, and pending user perspectives.
- Protected-route behavior for unauthenticated users.
- Unauthorized-role redirect behavior.
- Public/fallback route rendering.
- Feedback submission with screenshot upload through the E2E Supabase mock.

Verification:
- `npm.cmd test -- tests/role-smoke.spec.js --list`: passed, 23 tests discovered.
- `npm.cmd run test -- tests/role-smoke.spec.js --workers=1 --retries=0 --reporter=list`: passed, 23/23.
- `npm.cmd run test -- tests/coach.spec.js tests/parent-invitations.spec.js --workers=1 --retries=0 --reporter=list`: passed, 9/9 after stale flow assertions and the E2E fixture reset were fixed.
- `npm.cmd run test -- --workers=1 --retries=0 --reporter=list`: passed, 45/45.
- `npm.cmd run build`: passed.

Passing coverage:
- Admin, president, vice president, coach coordinator, girls coordinator, boys coordinator, youth head coach, youth coach, coach, tryout assessor, and pending user role surfaces rendered without blank screens.
- Unauthenticated users reached `/login` from protected routes.
- Parent `/admin`, coach `/admin/users`, tryout assessor `/admin/tryouts`, and pending `/admin` redirected away from disallowed routes and rendered safely.
- Public and fallback routes rendered usable pages.
- Feedback form accepted a PNG screenshot and completed with the storage mock.

Resolved bugs:

1. Team manager team route crashes after loading
   - Role/route: `team_manager` at `/manager/team`.
   - Failure: Error boundary shows `Unable to load team view.` with `Error: Rendered more hooks than during the previous render.`
   - Likely source: `src/pages/ManagerTeamPage.jsx` returns early for loading/no-team states before later `useMemo` hooks at lines 61, 75, and 91.
   - Resolution: hooks now run before conditional loading/empty returns.

2. Parent team route crashes after loading
   - Role/route: `parent` at `/parent/team`.
   - Failure: Error boundary shows `Unable to load team view.` with `Error: Rendered more hooks than during the previous render.`
   - Likely source: `src/pages/ParentTeamViewPage.jsx` returns early for loading/no-child states before later `useMemo` hooks at lines 62 and 91.
   - Resolution: hooks now run before conditional loading/empty returns.

3. Player portal crashes when revisiting or remounting
   - Role/routes: `player` at `/dashboard` and `/player`; also affects unauthorized player redirect from `/manager/team` because the safe landing page is `/dashboard`.
   - Failure: Error boundary shows `Unable to load dashboard.` or `Unable to load player portal.` with `Error: Canvas is already in use. Chart with ID '0' must be destroyed before the canvas with ID '' can be reused.`
   - Likely source: `src/pages/PlayerPortal.jsx` imports `Line` at line 16 and renders it at line 199; the chart is not being cleaned up safely across StrictMode/remounts.
   - Resolution: `PlayerPortal` now registers its Chart.js dependencies locally and destroys the player chart instance across route remounts.

4. Parent can open the assessor dashboard
   - Role/route: `parent` at `/assessor`.
   - Failure: expected redirect away from assessor-only surface, but final URL remains `/assessor`.
   - Likely source: `src/App.jsx` route for `/assessor` uses `<ProtectedRoute>` without `allowedRoles`; `/tryout/:sessionId` also has no `allowedRoles`.
   - Resolution: `/assessor` and `/tryout/:sessionId` now require `TRYOUT_ASSESSOR_ROLES`.

Non-blocking warnings observed:
- `TryoutAssessorPage` and `PlayerIDPPage` emit React unique-key warnings. They do not blank the page, so the smoke suite ignores them for crash-focused QA, but they should be cleaned up separately.
