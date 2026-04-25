# Supabase Deployment Notes

This rebuild keeps the existing Firebase-style app stable through `public.documents` and adds typed tables for the new video AI workflow.

## Migration Files

- `supabase/migrations/202604250001_documents_compat.sql`
  - Creates `public.documents(collection, id, data, created_at, updated_at, created_by, updated_by)`.
  - Adds role helper functions, RLS policies, JSONB indexes for the current Firestore query fields, and Realtime publication setup.
- `supabase/migrations/202604250002_storage_buckets_policies.sql`
  - Creates `feedback-screenshots`, `game-videos`, `video-recordings`, and `club-assets` buckets.
  - Replaces Firebase feedback screenshot rules and adds private video policies.
- `supabase/migrations/202604250003_video_ai_pipeline.sql`
  - Creates normalized video recording, upload, job queue, event, stats, highlight, and correction/approval tables.

## Apply Migrations

Use the Supabase CLI from this cloned repo:

```powershell
cd "C:\Users\Kidsg\OneDrive\Desktop\SIxth Man_Spud Rebuild_Supabase\sixth-man-codex-supabase"
supabase login
supabase link --project-ref <project-ref>
supabase db push --dry-run
supabase db push
```

For local testing, start the local stack and apply the migrations:

```powershell
supabase start
supabase db reset
```

Supabase's current CLI docs describe `db push`, `db reset`, and the local migration workflow here:
[CLI reference](https://supabase.com/docs/reference/cli/supabase-db-push) and
[local development with migrations](https://supabase.com/docs/guides/local-development/overview).

## Bootstrap Admin Access

RLS reads the current user's role from:

```sql
public.documents
where collection = 'users'
  and id = auth.uid()::text
```

Normal self-signup can only create safe user roles such as `pending`, `parent`, or `player`. Create the first admin with the SQL editor or service role after the first Auth user exists:

```sql
insert into public.documents (collection, id, data, created_by, updated_by)
values (
  'users',
  '<auth-user-uuid>',
  jsonb_build_object(
    'uid', '<auth-user-uuid>',
    'email', '<admin-email>',
    'displayName', '<admin-name>',
    'role', 'admin',
    'createdAt', now()
  ),
  '<auth-user-uuid>',
  '<auth-user-uuid>'
)
on conflict (collection, id) do update
set data = excluded.data,
    updated_by = excluded.updated_by;
```

## Auth Providers

Enable these providers in Supabase Auth:

- Email/password for existing email signup and sign-in.
- Google OAuth. Configure the Google client ID/secret, app origins, and Supabase callback URL. Supabase's Google guide lists the required OAuth setup and local callback URL.
- Apple OAuth. Configure the Apple provider in the Supabase dashboard with the app's web/native identifiers and callback URLs.

Provider docs:
[Google](https://supabase.com/docs/guides/auth/social-login/auth-google),
[Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple),
[Auth overview](https://supabase.com/docs/guides/auth).

## Storage

Buckets created by migration:

- `feedback-screenshots`: private. Authenticated users can read and upload images under `feedback/...`, capped at 5 MB.
- `game-videos`: private. Staff-only video uploads/read for game video.
- `video-recordings`: private. Staff-only video uploads/read for training/tryout/misc recordings.
- `club-assets`: public-read bucket for non-sensitive club assets.

Keep raw junior sports video private. Prefer short-lived signed URLs for playback, and avoid copying raw video into public buckets. Any AI worker should use the service role only on trusted server/worker infrastructure.

## Realtime

The migrations add these tables to `supabase_realtime` when that publication exists:

- `public.documents`
- `public.video_recording_sessions`
- `public.video_recordings`
- `public.video_analysis_jobs`
- `public.video_events`
- `public.game_video_stats`
- `public.video_highlights`
- `public.video_analysis_reviews`

Realtime still respects RLS for clients. If a table is not visible in the Supabase Realtime UI, enable it manually in the dashboard after migration.

## Privacy And Retention

- Treat all junior player video as private personal information.
- Collect guardian consent before upload, analysis, sharing, or highlight publication.
- Keep raw full-game video only as long as the club needs it for coaching, dispute review, or model QA. A practical starting policy is 90-180 days for raw video, with approved clips/stats retained longer if guardians and club policy allow it.
- Restrict parent access to approved child-linked stats/highlights. The schema intentionally does not grant parents raw video/event access.
- Log AI corrections in `video_analysis_reviews` instead of overwriting history silently.

## Known Gaps

- `public.documents` approximates Firestore rules but is intentionally conservative for service-only or under-specified youth collections.
- Parent invitation validation remains authenticated like the current Firestore rules. A dedicated RPC can be added later for public invitation-code validation without exposing full invitation rows.
- Multi-camera sync is represented by `sync_offset_ms` and `sync_calibration` jobs, but full sync workflows can be added after the first upload-and-analysis path is working.
