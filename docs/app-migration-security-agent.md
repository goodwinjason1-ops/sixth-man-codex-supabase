# Agent D: Security Hardening Status

Date: 2026-04-25

## Mission

Harden the Supabase/Postgres version of the app to industry-standard security expectations before production rollout.

## Completed

- Applied Supabase security hardening migration `202604250004_security_hardening.sql` to project `lipjgbcgwokhucbxinmn`.
- Reasserted enabled and forced RLS on `public.documents`, typed video AI tables, and `public.security_audit_events`.
- Added stricter storage policy guards for feedback screenshots, raw game videos, processed video artifacts, and public highlight assets.
- Restricted AI provider/model/result fields to trusted service-role worker paths.
- Added audit coverage for sensitive legacy document collections and video AI tables.
- Confirmed live role smoke coverage against the deployed Supabase project: 15/15 passed.

## Current Production Requirements

- Keep the Supabase service-role key only in trusted server/worker environments. It must never be exposed in Vite/client code.
- Run the future AI video worker with service role and short-lived signed URLs.
- Lock Supabase Auth redirect allowlists to the public GitHub Pages URL and approved local development URLs.
- Enable Supabase Auth protections in the dashboard where available: confirmed email flow, leaked password protection, and MFA for admins.
- Configure Storage CORS to production domains only.
- Define retention windows for raw video, feedback screenshots, audit events, and AI artifacts before real junior sports footage is used at scale.
- Continue tightening `public.documents` collection-level compatibility policies as each legacy domain moves to typed Postgres tables.

## Suggested Follow-Up Verification

```powershell
npm.cmd audit --audit-level=high
npx.cmd supabase db push --dry-run
npm.cmd run test -- tests/live-supabase.spec.js --config=playwright.live.config.js --workers=1 --retries=0 --reporter=list
```

## Accepted Temporary Exceptions

- The legacy Firebase-compatible document layer remains intentionally broad enough to preserve app behavior during migration. Risk reduces as features are moved to typed Supabase tables with narrower RLS policies.
- The AI analysis worker is not deployed yet; the app currently implements secure private video upload and queued analysis-job creation. Worker deployment should happen before production AI analysis is advertised as live.
