-- Security hardening layer for the Supabase rebuild.
-- This migration is intentionally additive: it does not rewrite prior policies,
-- but adds restrictive guards, least-privilege grants, and audit coverage.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.storage_object_name_is_safe(object_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    object_name is not null
    and object_name = btrim(object_name)
    and length(object_name) between 1 and 1024
    and object_name not like '/%'
    and object_name not like '%//%'
    and position(chr(92) in object_name) = 0
    and object_name !~ '(^|/)\.(/|$)'
    and object_name !~ '(^|/)\.\.(/|$)'
    and object_name !~ '[[:cntrl:]]',
    false
  );
$$;

create or replace function public.storage_object_extension(object_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when object_name is null or object_name !~ '\.[^./]+$' then ''
    else lower(regexp_replace(object_name, '^.*\.([^./]+)$', '\1'))
  end;
$$;

create or replace function public.storage_object_mime_type(object_metadata jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(coalesce(
    object_metadata->>'mimetype',
    object_metadata->>'mimeType',
    object_metadata->>'contentType',
    ''
  ));
$$;

create or replace function public.storage_object_size_bytes(object_metadata jsonb)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(object_metadata->>'size', '') ~ '^[0-9]+$'
      then (object_metadata->>'size')::bigint
    else null
  end;
$$;

create or replace function public.storage_object_read_is_allowed(
  object_bucket_id text,
  object_name text,
  object_owner uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if object_bucket_id not in (
    'feedback-screenshots',
    'game-videos',
    'video-recordings',
    'club-assets'
  ) then
    return true;
  end if;

  if object_bucket_id = 'club-assets' then
    return public.storage_object_name_is_safe(object_name);
  end if;

  if uid is null or not public.storage_object_name_is_safe(object_name) then
    return false;
  end if;

  if object_bucket_id = 'feedback-screenshots' then
    return object_name like 'feedback/%'
      and (object_owner = uid or public.is_admin());
  end if;

  if object_bucket_id in ('game-videos', 'video-recordings') then
    return public.is_video_staff();
  end if;

  return false;
end;
$$;

create or replace function public.storage_object_write_is_allowed(
  operation_name text,
  object_bucket_id text,
  object_name text,
  object_owner uuid,
  object_metadata jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  mime_type text := public.storage_object_mime_type(object_metadata);
  object_extension text := public.storage_object_extension(object_name);
  size_bytes bigint := coalesce(public.storage_object_size_bytes(object_metadata), 0);
begin
  if object_bucket_id not in (
    'feedback-screenshots',
    'game-videos',
    'video-recordings',
    'club-assets'
  ) then
    return true;
  end if;

  if uid is null
    or operation_name not in ('insert', 'update')
    or not public.storage_object_name_is_safe(object_name) then
    return false;
  end if;

  if object_bucket_id = 'feedback-screenshots' then
    return object_name like 'feedback/%'
      and object_owner = uid
      and mime_type = any (array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
      and object_extension = any (array['jpg', 'jpeg', 'png', 'webp', 'gif'])
      and size_bytes <= 5242880;
  end if;

  if object_bucket_id in ('game-videos', 'video-recordings') then
    return (
        object_owner = uid
        or public.is_admin()
        or public.is_coordinator()
      )
      and public.is_video_staff()
      and mime_type = any (array[
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'video/x-matroska',
        'application/octet-stream'
      ])
      and object_extension = any (array['mp4', 'mov', 'webm', 'mkv'])
      and size_bytes <= 10737418240;
  end if;

  if object_bucket_id = 'club-assets' then
    return (
        (operation_name = 'insert' and object_owner = uid)
        or (operation_name = 'update' and (public.is_admin() or public.is_coordinator()))
      )
      and (public.is_admin() or public.is_coordinator())
      and mime_type = any (array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
      and object_extension = any (array['jpg', 'jpeg', 'png', 'webp', 'pdf'])
      and size_bytes <= 20971520;
  end if;

  return false;
end;
$$;

create or replace function public.video_analysis_job_client_payload_is_safe(
  job_status text,
  job_provider text,
  job_model text,
  job_result jsonb,
  job_error_message text,
  job_attempts integer,
  job_locked_by text,
  job_locked_at timestamptz,
  job_started_at timestamptz,
  job_completed_at timestamptz,
  job_requested_by uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    ((job_requested_by = (select auth.uid())) or public.is_admin())
    and job_status in ('queued', 'cancelled')
    and job_provider is null
    and job_model is null
    and coalesce(job_result, '{}'::jsonb) = '{}'::jsonb
    and job_error_message is null
    and job_attempts = 0
    and job_locked_by is null
    and job_locked_at is null
    and job_started_at is null
    and job_completed_at is null,
    false
  );
$$;

create or replace function public.video_event_is_manual_or_import(video_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    video_event_id is null
    or exists (
      select 1
      from public.video_events as e
      where e.id = video_event_id
        and e.source in ('manual', 'import')
    ),
    false
  );
$$;

create table if not exists public.security_audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  source_table text not null,
  source_pk text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid default auth.uid() references auth.users (id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now()
);

comment on table public.security_audit_events is
  'Admin-readable audit trail for sensitive document changes and video AI pipeline mutations. Client roles cannot insert directly.';
comment on function public.storage_object_write_is_allowed(text, text, text, uuid, jsonb) is
  'Restrictive guard for managed Supabase Storage buckets. Raw video and AI worker outputs should be written by trusted staff flows or service-role workers only.';
comment on function public.video_analysis_job_client_payload_is_safe(text, text, text, jsonb, text, integer, text, timestamptz, timestamptz, timestamptz, uuid) is
  'Allows authenticated clients to create/cancel clean queued jobs only; provider, lock, attempt, result, and error fields are service-role worker fields.';
comment on function public.video_event_is_manual_or_import(uuid) is
  'Security-definer helper used by RLS so client-entered stats can reference only manual/import video events.';

create index if not exists security_audit_events_source_idx
  on public.security_audit_events (source_table, occurred_at desc);
create index if not exists security_audit_events_actor_idx
  on public.security_audit_events (actor_id, occurred_at desc)
  where actor_id is not null;
create index if not exists security_audit_events_source_pk_idx
  on public.security_audit_events (source_table, source_pk);

create or replace function public.log_security_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_key text;
  should_log boolean := true;
begin
  if tg_table_schema <> 'public' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_table_name = 'documents' then
    if tg_op = 'DELETE' then
      should_log := old.collection in ('users', 'audit_logs', 'parent_invitations', 'beta_feedback');
      row_key := old.collection || '/' || old.id;
    else
      should_log := new.collection in ('users', 'audit_logs', 'parent_invitations', 'beta_feedback');
      row_key := new.collection || '/' || new.id;
    end if;

    if not should_log then
      if tg_op = 'DELETE' then
        return old;
      end if;
      return new;
    end if;
  elsif tg_op = 'DELETE' then
    row_key := old.id::text;
  else
    row_key := new.id::text;
  end if;

  insert into public.security_audit_events (
    source_table,
    source_pk,
    action,
    actor_id,
    before_data,
    after_data,
    metadata
  )
  values (
    tg_table_name,
    row_key,
    tg_op,
    (select auth.uid()),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    jsonb_build_object(
      'application_name', current_setting('application_name', true),
      'trigger_name', tg_name
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists documents_security_audit on public.documents;
create trigger documents_security_audit
after insert or update or delete on public.documents
for each row execute function public.log_security_audit_event();

drop trigger if exists video_recording_sessions_security_audit on public.video_recording_sessions;
create trigger video_recording_sessions_security_audit
after insert or update or delete on public.video_recording_sessions
for each row execute function public.log_security_audit_event();

drop trigger if exists video_recordings_security_audit on public.video_recordings;
create trigger video_recordings_security_audit
after insert or update or delete on public.video_recordings
for each row execute function public.log_security_audit_event();

drop trigger if exists video_analysis_jobs_security_audit on public.video_analysis_jobs;
create trigger video_analysis_jobs_security_audit
after insert or update or delete on public.video_analysis_jobs
for each row execute function public.log_security_audit_event();

drop trigger if exists video_events_security_audit on public.video_events;
create trigger video_events_security_audit
after insert or update or delete on public.video_events
for each row execute function public.log_security_audit_event();

drop trigger if exists game_video_stats_security_audit on public.game_video_stats;
create trigger game_video_stats_security_audit
after insert or update or delete on public.game_video_stats
for each row execute function public.log_security_audit_event();

drop trigger if exists video_highlights_security_audit on public.video_highlights;
create trigger video_highlights_security_audit
after insert or update or delete on public.video_highlights
for each row execute function public.log_security_audit_event();

drop trigger if exists video_analysis_reviews_security_audit on public.video_analysis_reviews;
create trigger video_analysis_reviews_security_audit
after insert or update or delete on public.video_analysis_reviews
for each row execute function public.log_security_audit_event();

alter table public.documents enable row level security;
alter table public.documents force row level security;
alter table public.video_recording_sessions enable row level security;
alter table public.video_recording_sessions force row level security;
alter table public.video_recordings enable row level security;
alter table public.video_recordings force row level security;
alter table public.video_analysis_jobs enable row level security;
alter table public.video_analysis_jobs force row level security;
alter table public.video_events enable row level security;
alter table public.video_events force row level security;
alter table public.game_video_stats enable row level security;
alter table public.game_video_stats force row level security;
alter table public.video_highlights enable row level security;
alter table public.video_highlights force row level security;
alter table public.video_analysis_reviews enable row level security;
alter table public.video_analysis_reviews force row level security;
alter table public.security_audit_events enable row level security;
alter table public.security_audit_events force row level security;

do $$
declare
  missing_rls text;
begin
  select string_agg(format('%I.%I', n.nspname, c.relname), ', ' order by n.nspname, c.relname)
  into missing_rls
  from pg_class as c
  join pg_namespace as n on n.oid = c.relnamespace
  where c.relkind = 'r'
    and n.nspname = 'public'
    and c.relname = any (array[
      'documents',
      'video_recording_sessions',
      'video_recordings',
      'video_analysis_jobs',
      'video_events',
      'game_video_stats',
      'video_highlights',
      'video_analysis_reviews',
      'security_audit_events'
    ])
    and (not c.relrowsecurity or not c.relforcerowsecurity);

  if missing_rls is not null then
    raise exception 'Required public tables missing enabled/forced RLS: %', missing_rls;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'storage'
      and c.relname = 'objects'
      and c.relrowsecurity
  ) then
    raise exception 'storage.objects must have RLS enabled before deployment';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'video_recordings_object_path_safe'
      and conrelid = 'public.video_recordings'::regclass
  ) then
    alter table public.video_recordings
      add constraint video_recordings_object_path_safe
      check (public.storage_object_name_is_safe(object_path)) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'video_highlights_clip_path_safe'
      and conrelid = 'public.video_highlights'::regclass
  ) then
    alter table public.video_highlights
      add constraint video_highlights_clip_path_safe
      check (clip_object_path is null or public.storage_object_name_is_safe(clip_object_path)) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'video_highlights_thumbnail_path_safe'
      and conrelid = 'public.video_highlights'::regclass
  ) then
    alter table public.video_highlights
      add constraint video_highlights_thumbnail_path_safe
      check (thumbnail_object_path is null or public.storage_object_name_is_safe(thumbnail_object_path)) not valid;
  end if;
end;
$$;

drop policy if exists "security audit admin read" on public.security_audit_events;
create policy "security audit admin read"
on public.security_audit_events
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "security audit internal insert" on public.security_audit_events;
create policy "security audit internal insert"
on public.security_audit_events
for insert
to public
with check (true);

drop policy if exists "documents audit logs admin insert guard" on public.documents;
create policy "documents audit logs admin insert guard"
on public.documents
as restrictive
for insert
to authenticated
with check (
  collection <> 'audit_logs'
  or (select public.is_admin())
);

drop policy if exists "raw video tables current staff read guard" on public.video_recording_sessions;
create policy "raw video tables current staff read guard"
on public.video_recording_sessions
as restrictive
for select
to authenticated
using ((select public.is_video_staff()));

drop policy if exists "video recordings current staff read guard" on public.video_recordings;
create policy "video recordings current staff read guard"
on public.video_recordings
as restrictive
for select
to authenticated
using ((select public.is_video_staff()));

drop policy if exists "analysis jobs current staff read guard" on public.video_analysis_jobs;
create policy "analysis jobs current staff read guard"
on public.video_analysis_jobs
as restrictive
for select
to authenticated
using ((select public.is_video_staff()));

drop policy if exists "video events current staff read guard" on public.video_events;
create policy "video events current staff read guard"
on public.video_events
as restrictive
for select
to authenticated
using ((select public.is_video_staff()));

drop policy if exists "video reviews current staff read guard" on public.video_analysis_reviews;
create policy "video reviews current staff read guard"
on public.video_analysis_reviews
as restrictive
for select
to authenticated
using ((select public.is_video_staff()));

drop policy if exists "video sessions current staff write guard" on public.video_recording_sessions;
create policy "video sessions current staff write guard"
on public.video_recording_sessions
as restrictive
for update
to authenticated
using ((select public.is_video_staff()))
with check ((select public.is_video_staff()));

drop policy if exists "video recordings current staff write guard" on public.video_recordings;
create policy "video recordings current staff write guard"
on public.video_recordings
as restrictive
for update
to authenticated
using ((select public.is_video_staff()))
with check ((select public.is_video_staff()));

drop policy if exists "analysis jobs client insert guard" on public.video_analysis_jobs;
create policy "analysis jobs client insert guard"
on public.video_analysis_jobs
as restrictive
for insert
to authenticated
with check (
  (select public.video_analysis_job_client_payload_is_safe(
    status,
    provider,
    model,
    result,
    error_message,
    attempts,
    locked_by,
    locked_at,
    started_at,
    completed_at,
    requested_by
  ))
);

drop policy if exists "analysis jobs client update guard" on public.video_analysis_jobs;
create policy "analysis jobs client update guard"
on public.video_analysis_jobs
as restrictive
for update
to authenticated
using (
  status = 'queued'
  and (
    requested_by = (select auth.uid())
    or (select public.is_admin())
  )
)
with check (
  (select public.video_analysis_job_client_payload_is_safe(
    status,
    provider,
    model,
    result,
    error_message,
    attempts,
    locked_by,
    locked_at,
    started_at,
    completed_at,
    requested_by
  ))
);

drop policy if exists "video events no client ai output guard" on public.video_events;
create policy "video events no client ai output guard"
on public.video_events
as restrictive
for insert
to authenticated
with check (
  source in ('manual', 'import')
  and analysis_job_id is null
  and approved_by is null
  and approved_at is null
);

drop policy if exists "video events no client ai update guard" on public.video_events;
create policy "video events no client ai update guard"
on public.video_events
as restrictive
for update
to authenticated
using ((select public.is_video_staff()))
with check (
  source in ('manual', 'import')
  and analysis_job_id is null
);

drop policy if exists "game video stats no client ai output guard" on public.game_video_stats;
create policy "game video stats no client ai output guard"
on public.game_video_stats
as restrictive
for insert
to authenticated
with check (
  source in ('manual', 'import')
  and (select public.video_event_is_manual_or_import(event_id))
  and approved_by is null
  and approved_at is null
);

drop policy if exists "game video stats no client ai update guard" on public.game_video_stats;
create policy "game video stats no client ai update guard"
on public.game_video_stats
as restrictive
for update
to authenticated
using ((select public.is_video_staff()))
with check (
  source in ('manual', 'import')
);

drop policy if exists "video highlights client workflow guard" on public.video_highlights;
create policy "video highlights client workflow guard"
on public.video_highlights
as restrictive
for insert
to authenticated
with check (
  status = 'draft'
  and confidence is null
  and approved_by is null
  and approved_at is null
);

drop policy if exists "video highlights publish guard" on public.video_highlights;
create policy "video highlights publish guard"
on public.video_highlights
as restrictive
for update
to authenticated
using ((select public.is_video_staff()))
with check (
  (
    status not in ('approved', 'published')
    or (
      (select public.is_admin()) or (select public.is_coordinator())
    )
  )
  and (
    visibility <> 'public'
    or (
      ((select public.is_admin()) or (select public.is_coordinator()))
      and clip_bucket_id = 'club-assets'
      and (thumbnail_bucket_id is null or thumbnail_bucket_id = 'club-assets')
    )
  )
  and (approved_by is null or approved_by = (select auth.uid()))
);

drop policy if exists "video reviews no client delete guard" on public.video_analysis_reviews;
create policy "video reviews no client delete guard"
on public.video_analysis_reviews
as restrictive
for delete
to authenticated
using (false);

drop policy if exists "storage managed bucket authenticated read guard" on storage.objects;
create policy "storage managed bucket authenticated read guard"
on storage.objects
as restrictive
for select
to authenticated
using (
  bucket_id not in ('feedback-screenshots', 'game-videos', 'video-recordings', 'club-assets')
  or (select public.storage_object_read_is_allowed(bucket_id, name, owner))
);

drop policy if exists "storage club assets anon read guard" on storage.objects;
create policy "storage club assets anon read guard"
on storage.objects
as restrictive
for select
to anon
using (
  bucket_id <> 'club-assets'
  or public.storage_object_name_is_safe(name)
);

drop policy if exists "storage managed bucket authenticated insert guard" on storage.objects;
create policy "storage managed bucket authenticated insert guard"
on storage.objects
as restrictive
for insert
to authenticated
with check (
  bucket_id not in ('feedback-screenshots', 'game-videos', 'video-recordings', 'club-assets')
  or (select public.storage_object_write_is_allowed('insert', bucket_id, name, owner, metadata))
);

drop policy if exists "storage managed bucket authenticated update guard" on storage.objects;
create policy "storage managed bucket authenticated update guard"
on storage.objects
as restrictive
for update
to authenticated
using (
  bucket_id not in ('feedback-screenshots', 'game-videos', 'video-recordings', 'club-assets')
  or (select public.storage_object_write_is_allowed('update', bucket_id, name, owner, metadata))
)
with check (
  bucket_id not in ('feedback-screenshots', 'game-videos', 'video-recordings', 'club-assets')
  or (select public.storage_object_write_is_allowed('update', bucket_id, name, owner, metadata))
);

revoke all on schema public from public;
grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.documents from public, anon, authenticated;
grant select on table public.documents to anon, authenticated;
grant insert, update, delete on table public.documents to authenticated;
grant all on table public.documents to service_role;

revoke all on table
  public.video_recording_sessions,
  public.video_recordings,
  public.video_analysis_jobs,
  public.video_events,
  public.game_video_stats,
  public.video_highlights,
  public.video_analysis_reviews
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.video_recording_sessions,
  public.video_recordings,
  public.video_analysis_jobs,
  public.video_events,
  public.game_video_stats,
  public.video_highlights,
  public.video_analysis_reviews
to authenticated;

grant all on table
  public.video_recording_sessions,
  public.video_recordings,
  public.video_analysis_jobs,
  public.video_events,
  public.game_video_stats,
  public.video_highlights,
  public.video_analysis_reviews
to service_role;

revoke all on table public.security_audit_events from public, anon, authenticated;
grant select on table public.security_audit_events to authenticated;
grant all on table public.security_audit_events to service_role;

revoke execute on all functions in schema public from public;
grant execute on all functions in schema public to anon, authenticated, service_role;

comment on column public.video_analysis_jobs.provider is
  'Service-role AI worker field. Authenticated clients may request/cancel queued jobs only.';
comment on column public.video_analysis_jobs.model is
  'Service-role AI worker field. Do not trust client-supplied model values.';
comment on column public.video_analysis_jobs.result is
  'Service-role AI worker output. Client writes are blocked by restrictive RLS.';
comment on column public.video_analysis_jobs.error_message is
  'Service-role AI worker diagnostic output. Keep provider secrets out of this field.';
comment on column public.video_analysis_jobs.locked_by is
  'Service-role worker lock field. Clients must not set worker locks.';
comment on column public.video_analysis_jobs.locked_at is
  'Service-role worker lock field. Clients must not set worker locks.';
comment on table public.video_events is
  'Detected or manually entered video events. AI-generated rows should be inserted by trusted service-role workers.';
comment on table public.game_video_stats is
  'AI/manual game statistics derived from video. Client writes are limited to manual/import rows.';
comment on table public.video_highlights is
  'Video highlight metadata. Public publishing requires coordinator/admin approval and public-safe club-assets clips.';
