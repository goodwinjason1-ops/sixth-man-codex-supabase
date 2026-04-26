# Supabase QA Bootstrap

Use `scripts/supabase-qa-bootstrap.mjs` to prepare live-project QA accounts and compatibility documents from `tests/e2eFixtures.js`.

The script:

- Creates or updates one confirmed Supabase Auth user for every fixture role.
- Uses `QA_PASSWORD` when provided, otherwise a generated one-time password that is not printed.
- Upserts the fixture rows into `public.documents`.
- Rewrites fixture user ids such as `coach-user`, `parent-user`, and `tryout_assessor-user` to the real Supabase Auth UUIDs in user documents and common references.
- Prints only high-level counts, fixture emails, and the password source. It does not print service keys.

## Run Securely

Run this only from a trusted terminal. Never put the service role key in frontend code, screenshots, chat, or committed files.

```powershell
cd "C:\Users\Kidsg\OneDrive\Desktop\SIxth Man_Spud Rebuild_Supabase\sixth-man-codex-supabase"
$env:SUPABASE_URL="https://<project-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
$env:QA_PASSWORD="<strong-shared-qa-password>"
node scripts/supabase-qa-bootstrap.mjs
```

Set `QA_PASSWORD` when you need to sign in with the generated QA accounts after bootstrapping. If it is omitted, the script still creates safe accounts, but the generated password is intentionally not displayed.

Preview what would happen:

```powershell
node scripts/supabase-qa-bootstrap.mjs --dry-run
```

Verify an already-bootstrapped project without writing:

```powershell
node scripts/supabase-qa-bootstrap.mjs --smoke-only
```

After running, close the terminal or clear the environment variables:

```powershell
Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY
Remove-Item Env:\QA_PASSWORD
```

## QA Commands

Local mock smoke tests use the Playwright config in `playwright.config.js`. This starts Vite in `e2e` mode with mock Supabase enabled:

```powershell
npm test
```

Live Supabase smoke tests use `playwright.live.config.js` and `tests/live-supabase.spec.js`. The runner fails early with a clear message when required environment variables are missing.

Deployed GitHub Pages QA:

```powershell
$env:LIVE_QA_PASSWORD="<shared-qa-password>"
npm run qa:live:deployed
```

`qa:live:deployed` supplies these defaults:

```powershell
LIVE_BASE_URL=https://goodwinjason1-ops.github.io
LIVE_BASE_PATH=/sixth-man-codex-supabase
```

Custom deployed/live URL QA:

```powershell
$env:LIVE_BASE_URL="https://example.com"
$env:LIVE_BASE_PATH="/optional-base-path"
$env:LIVE_QA_PASSWORD="<shared-qa-password>"
npm run qa:live
```

Local dev-server QA against a real Supabase project:

```powershell
$env:VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="<anon-key>"
$env:VITE_SUPABASE_STORAGE_BUCKET="feedback-screenshots"
$env:LIVE_QA_PASSWORD="<shared-qa-password>"
npm run qa:live
```

Do not run local/live QA without the Supabase Vite variables. Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` can produce a blank local screen before the app reaches the role smoke checks.

## Browser Use / Computer Use Note

In this Codex desktop session, Browser Use can read tab metadata but DOM and screenshot capture currently fail with:

```text
failed to start codex app-server: The system cannot find the path specified. (os error 3)
```

Until that app-server path issue is fixed in the environment, prefer Playwright for repeatable local and deployed QA evidence. Browser Use remains useful only for lightweight tab awareness in this session.
