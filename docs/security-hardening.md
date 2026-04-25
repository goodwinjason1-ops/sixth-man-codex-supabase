# Security Hardening Notes

This document tracks the additive hardening added in `supabase/migrations/202604250004_security_hardening.sql`.

Deployment status: applied to Supabase project `lipjgbcgwokhucbxinmn` on 2026-04-25 after `supabase db push --dry-run` confirmed it was the only pending migration.

## Database Hardening

- Reasserts enabled and forced RLS on `public.documents`, all video AI tables, and the new `public.security_audit_events` table.
- Fails migration if any required public table is missing enabled/forced RLS, or if Supabase-managed `storage.objects` does not already have RLS enabled.
- Revokes broad `PUBLIC` access on the public schema, target tables, and public functions, then grants only the app roles needed for RLS-backed access.
- Keeps `anon` access to `public.documents` select only so existing public team reads still work through RLS.
- Grants service-role table access explicitly for trusted server and worker operations.

## Storage Hardening

- Adds restrictive guards for managed buckets without editing the original storage policies.
- Tightens feedback screenshot reads to the object owner or admins.
- Requires raw video reads to come from current video staff roles, not merely the original uploader.
- Requires safe object names, bucket-appropriate MIME types, expected file extensions, and bucket size limits for authenticated writes.
- Blocks client uploads of SVGs to the public `club-assets` bucket. Use sanitized service-role uploads only if SVGs are truly needed.

## Video AI Hardening

- Limits authenticated clients to creating or cancelling clean queued `video_analysis_jobs`.
- Treats provider, model, lock, attempts, result, and error fields as service-role worker fields.
- Blocks authenticated clients from writing AI-sourced `video_events` and `game_video_stats`; client writes must be manual/import rows.
- Restricts public highlight publishing to coordinator/admin approval and public-safe `club-assets` objects.
- Makes `video_analysis_reviews` client-immutable; direct client delete is blocked by restrictive RLS.

## Audit Coverage

- Adds `public.security_audit_events` with admin-only reads and no direct client write grants.
- Audits sensitive legacy document collections: `users`, `audit_logs`, `parent_invitations`, and `beta_feedback`.
- Audits inserts, updates, and deletes across the video recording, analysis, events, stats, highlights, and review tables.

## Production Blockers Outside SQL

- Enable Supabase Auth protections in the dashboard: confirmed email flow, secure redirect allowlist, leaked password protection if available, and MFA for admins.
- Keep the service-role key only in trusted server/worker environments. Never expose it in Vite/client code.
- Run AI video workers with service role and short-lived signed URLs. Do not process raw junior sports video from public buckets.
- Configure Storage CORS to the production domains only.
- Define retention policy for raw video, audit events, feedback screenshots, and AI artifacts before launch.
- Review `public.documents` collection-level rules after migration. The compatibility layer is intentionally broad for legacy app stability and should be tightened as domains move to typed tables.
