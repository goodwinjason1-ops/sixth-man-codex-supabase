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
