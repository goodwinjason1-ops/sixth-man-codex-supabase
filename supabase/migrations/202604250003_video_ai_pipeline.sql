-- Normalized video AI pipeline tables.
-- The legacy app should continue using public.documents for existing domains;
-- these tables are for new upload, queue, analysis, review, and highlight flows.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.video_recording_sessions (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'game'
    check (source_type in ('game', 'training', 'tryout', 'scout', 'other')),
  title text not null,
  game_id text,
  team_id text,
  opponent text,
  venue text,
  session_date date,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'planned'
    check (status in ('planned', 'recording', 'uploaded', 'queued', 'analysing', 'review', 'approved', 'archived')),
  privacy_level text not null default 'staff'
    check (privacy_level in ('staff', 'team', 'parents', 'public')),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_recording_sessions_ends_after_starts
    check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists public.video_recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.video_recording_sessions (id) on delete cascade,
  bucket_id text not null check (bucket_id in ('game-videos', 'video-recordings')),
  object_path text not null,
  camera_label text,
  camera_index integer not null default 1 check (camera_index > 0),
  camera_role text not null default 'main'
    check (camera_role in ('main', 'baseline', 'sideline', 'scoreboard', 'other')),
  upload_status text not null default 'uploaded'
    check (upload_status in ('pending', 'uploading', 'uploaded', 'processing', 'failed', 'deleted')),
  recorded_start_at timestamptz,
  recorded_end_at timestamptz,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  sync_offset_ms integer not null default 0,
  fps numeric(8,3) check (fps is null or fps > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha256 text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  uploaded_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, object_path),
  constraint video_recordings_end_after_start
    check (recorded_end_at is null or recorded_start_at is null or recorded_end_at >= recorded_start_at)
);

create table if not exists public.video_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.video_recording_sessions (id) on delete cascade,
  recording_id uuid references public.video_recordings (id) on delete set null,
  job_kind text not null
    check (job_kind in (
      'transcode', 'vision_event_detection', 'player_tracking',
      'stat_extraction', 'highlight_generation', 'sync_calibration',
      'quality_check'
    )),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'needs_review')),
  priority smallint not null default 50 check (priority between 0 and 100),
  provider text,
  model text,
  input jsonb not null default '{}'::jsonb
    check (jsonb_typeof(input) = 'object'),
  parameters jsonb not null default '{}'::jsonb
    check (jsonb_typeof(parameters) = 'object'),
  result jsonb not null default '{}'::jsonb
    check (jsonb_typeof(result) = 'object'),
  error_message text,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  locked_by text,
  locked_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  requested_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_analysis_jobs_completed_after_started
    check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table if not exists public.video_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.video_recording_sessions (id) on delete cascade,
  recording_id uuid references public.video_recordings (id) on delete set null,
  analysis_job_id uuid references public.video_analysis_jobs (id) on delete set null,
  event_type text not null,
  period smallint check (period is null or period > 0),
  game_clock text,
  start_ms integer not null check (start_ms >= 0),
  end_ms integer check (end_ms is null or end_ms >= start_ms),
  team_id text,
  player_id text,
  secondary_player_id text,
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  source text not null default 'ai' check (source in ('ai', 'manual', 'import')),
  status text not null default 'detected'
    check (status in ('detected', 'approved', 'rejected', 'corrected')),
  court_position jsonb not null default '{}'::jsonb,
  bounding_boxes jsonb not null default '[]'::jsonb,
  attributes jsonb not null default '{}'::jsonb
    check (jsonb_typeof(attributes) = 'object'),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_video_stats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.video_recording_sessions (id) on delete cascade,
  event_id uuid references public.video_events (id) on delete set null,
  game_id text,
  team_id text,
  player_id text,
  stat_type text not null,
  stat_value numeric(10,2) not null default 1,
  period smallint check (period is null or period > 0),
  game_clock text,
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  source text not null default 'ai' check (source in ('ai', 'manual', 'import')),
  status text not null default 'detected'
    check (status in ('detected', 'approved', 'rejected', 'corrected')),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_highlights (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.video_recording_sessions (id) on delete cascade,
  recording_id uuid references public.video_recordings (id) on delete set null,
  event_id uuid references public.video_events (id) on delete set null,
  stat_id uuid references public.game_video_stats (id) on delete set null,
  title text not null,
  description text,
  start_ms integer not null check (start_ms >= 0),
  end_ms integer not null check (end_ms >= start_ms),
  clip_bucket_id text check (clip_bucket_id is null or clip_bucket_id in ('game-videos', 'video-recordings', 'club-assets')),
  clip_object_path text,
  thumbnail_bucket_id text check (thumbnail_bucket_id is null or thumbnail_bucket_id in ('game-videos', 'video-recordings', 'club-assets')),
  thumbnail_object_path text,
  visibility text not null default 'staff'
    check (visibility in ('staff', 'team', 'parents', 'public')),
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'generated', 'approved', 'rejected', 'published', 'archived')),
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_analysis_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.video_recording_sessions (id) on delete cascade,
  target_table text not null
    check (target_table in ('video_events', 'game_video_stats', 'video_highlights', 'video_recordings', 'video_analysis_jobs')),
  target_id uuid not null,
  action text not null check (action in ('approved', 'rejected', 'corrected', 'commented', 'redacted')),
  before_data jsonb not null default '{}'::jsonb,
  after_data jsonb not null default '{}'::jsonb,
  reason text,
  reviewed_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

comment on table public.video_analysis_jobs is
  'Queue/state table for asynchronous AI video processing. Service-role workers bypass RLS; client reads remain staff-scoped.';
comment on table public.video_analysis_reviews is
  'Immutable correction and approval audit trail for AI-derived video outputs.';

create index if not exists video_recording_sessions_game_id_idx
  on public.video_recording_sessions (game_id) where game_id is not null;
create index if not exists video_recording_sessions_team_date_idx
  on public.video_recording_sessions (team_id, session_date desc) where team_id is not null;
create index if not exists video_recording_sessions_status_idx
  on public.video_recording_sessions (status, created_at desc);
create index if not exists video_recording_sessions_created_by_idx
  on public.video_recording_sessions (created_by) where created_by is not null;

create index if not exists video_recordings_session_id_idx
  on public.video_recordings (session_id);
create index if not exists video_recordings_upload_status_idx
  on public.video_recordings (upload_status, created_at desc);
create index if not exists video_recordings_uploaded_by_idx
  on public.video_recordings (uploaded_by) where uploaded_by is not null;

create index if not exists video_analysis_jobs_session_id_idx
  on public.video_analysis_jobs (session_id);
create index if not exists video_analysis_jobs_recording_id_idx
  on public.video_analysis_jobs (recording_id) where recording_id is not null;
create index if not exists video_analysis_jobs_status_priority_idx
  on public.video_analysis_jobs (status, priority asc, created_at asc);
create index if not exists video_analysis_jobs_queued_idx
  on public.video_analysis_jobs (priority asc, created_at asc)
  where status = 'queued';
create index if not exists video_analysis_jobs_requested_by_idx
  on public.video_analysis_jobs (requested_by) where requested_by is not null;

create index if not exists video_events_session_time_idx
  on public.video_events (session_id, start_ms asc);
create index if not exists video_events_recording_id_idx
  on public.video_events (recording_id) where recording_id is not null;
create index if not exists video_events_analysis_job_id_idx
  on public.video_events (analysis_job_id) where analysis_job_id is not null;
create index if not exists video_events_player_idx
  on public.video_events (player_id, session_id) where player_id is not null;
create index if not exists video_events_team_idx
  on public.video_events (team_id, session_id) where team_id is not null;
create index if not exists video_events_type_status_idx
  on public.video_events (event_type, status, session_id);
create index if not exists video_events_attributes_gin_idx
  on public.video_events using gin (attributes jsonb_path_ops);

create index if not exists game_video_stats_session_idx
  on public.game_video_stats (session_id);
create index if not exists game_video_stats_event_idx
  on public.game_video_stats (event_id) where event_id is not null;
create index if not exists game_video_stats_game_idx
  on public.game_video_stats (game_id) where game_id is not null;
create index if not exists game_video_stats_player_stat_idx
  on public.game_video_stats (player_id, stat_type, session_id) where player_id is not null;
create index if not exists game_video_stats_team_stat_idx
  on public.game_video_stats (team_id, stat_type, session_id) where team_id is not null;
create index if not exists game_video_stats_status_idx
  on public.game_video_stats (status, created_at desc);
create unique index if not exists game_video_stats_event_stat_unique_idx
  on public.game_video_stats (event_id, stat_type, player_id)
  where event_id is not null;

create index if not exists video_highlights_session_idx
  on public.video_highlights (session_id, created_at desc);
create index if not exists video_highlights_recording_idx
  on public.video_highlights (recording_id) where recording_id is not null;
create index if not exists video_highlights_event_idx
  on public.video_highlights (event_id) where event_id is not null;
create index if not exists video_highlights_stat_idx
  on public.video_highlights (stat_id) where stat_id is not null;
create index if not exists video_highlights_visibility_status_idx
  on public.video_highlights (visibility, status, created_at desc);

create index if not exists video_analysis_reviews_session_idx
  on public.video_analysis_reviews (session_id) where session_id is not null;
create index if not exists video_analysis_reviews_target_idx
  on public.video_analysis_reviews (target_table, target_id);
create index if not exists video_analysis_reviews_reviewed_by_idx
  on public.video_analysis_reviews (reviewed_by);

create or replace function public.video_highlight_is_for_linked_player(
  highlight_event_id uuid,
  highlight_stat_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.video_events as e
    where e.id = highlight_event_id
      and e.player_id = any (public.current_user_linked_player_ids())
  )
  or exists (
    select 1
    from public.game_video_stats as s
    where s.id = highlight_stat_id
      and s.player_id = any (public.current_user_linked_player_ids())
  );
$$;

drop trigger if exists video_recording_sessions_set_updated_at on public.video_recording_sessions;
create trigger video_recording_sessions_set_updated_at
before insert or update on public.video_recording_sessions
for each row execute function public.set_updated_at();

drop trigger if exists video_recordings_set_updated_at on public.video_recordings;
create trigger video_recordings_set_updated_at
before insert or update on public.video_recordings
for each row execute function public.set_updated_at();

drop trigger if exists video_analysis_jobs_set_updated_at on public.video_analysis_jobs;
create trigger video_analysis_jobs_set_updated_at
before insert or update on public.video_analysis_jobs
for each row execute function public.set_updated_at();

drop trigger if exists video_events_set_updated_at on public.video_events;
create trigger video_events_set_updated_at
before insert or update on public.video_events
for each row execute function public.set_updated_at();

drop trigger if exists game_video_stats_set_updated_at on public.game_video_stats;
create trigger game_video_stats_set_updated_at
before insert or update on public.game_video_stats
for each row execute function public.set_updated_at();

drop trigger if exists video_highlights_set_updated_at on public.video_highlights;
create trigger video_highlights_set_updated_at
before insert or update on public.video_highlights
for each row execute function public.set_updated_at();

alter table public.video_recording_sessions enable row level security;
alter table public.video_recordings enable row level security;
alter table public.video_analysis_jobs enable row level security;
alter table public.video_events enable row level security;
alter table public.game_video_stats enable row level security;
alter table public.video_highlights enable row level security;
alter table public.video_analysis_reviews enable row level security;

alter table public.video_recording_sessions force row level security;
alter table public.video_recordings force row level security;
alter table public.video_analysis_jobs force row level security;
alter table public.video_events force row level security;
alter table public.game_video_stats force row level security;
alter table public.video_highlights force row level security;
alter table public.video_analysis_reviews force row level security;

create policy "video sessions staff or owner read"
on public.video_recording_sessions
for select
to authenticated
using (
  (select public.is_video_staff())
  or created_by = (select auth.uid())
);

create policy "video sessions staff insert"
on public.video_recording_sessions
for insert
to authenticated
with check (
  (select public.is_video_staff())
  and created_by = (select auth.uid())
);

create policy "video sessions staff or owner update"
on public.video_recording_sessions
for update
to authenticated
using (
  (select public.is_video_staff())
  or created_by = (select auth.uid())
)
with check (
  (select public.is_video_staff())
  or created_by = (select auth.uid())
);

create policy "video sessions admin delete"
on public.video_recording_sessions
for delete
to authenticated
using ((select public.is_admin()));

create policy "video recordings staff or uploader read"
on public.video_recordings
for select
to authenticated
using (
  (select public.is_video_staff())
  or uploaded_by = (select auth.uid())
);

create policy "video recordings staff insert"
on public.video_recordings
for insert
to authenticated
with check (
  (select public.is_video_staff())
  and uploaded_by = (select auth.uid())
);

create policy "video recordings staff update"
on public.video_recordings
for update
to authenticated
using (
  (select public.is_video_staff())
  or uploaded_by = (select auth.uid())
)
with check (
  (select public.is_video_staff())
  or uploaded_by = (select auth.uid())
);

create policy "video recordings admin delete"
on public.video_recordings
for delete
to authenticated
using ((select public.is_admin()));

create policy "analysis jobs staff or requester read"
on public.video_analysis_jobs
for select
to authenticated
using (
  (select public.is_video_staff())
  or requested_by = (select auth.uid())
);

create policy "analysis jobs staff insert"
on public.video_analysis_jobs
for insert
to authenticated
with check ((select public.is_video_staff()));

create policy "analysis jobs staff update"
on public.video_analysis_jobs
for update
to authenticated
using ((select public.is_video_staff()))
with check ((select public.is_video_staff()));

create policy "analysis jobs admin delete"
on public.video_analysis_jobs
for delete
to authenticated
using ((select public.is_admin()));

create policy "video events staff read"
on public.video_events
for select
to authenticated
using (
  (select public.is_video_staff())
  or created_by = (select auth.uid())
);

create policy "video events staff insert"
on public.video_events
for insert
to authenticated
with check ((select public.is_video_staff()));

create policy "video events staff update"
on public.video_events
for update
to authenticated
using ((select public.is_video_staff()))
with check ((select public.is_video_staff()));

create policy "video events admin delete"
on public.video_events
for delete
to authenticated
using ((select public.is_admin()));

create policy "game video stats staff parent read"
on public.game_video_stats
for select
to authenticated
using (
  (select public.is_video_staff())
  or created_by = (select auth.uid())
  or (
    status = 'approved'
    and player_id = any (public.current_user_linked_player_ids())
  )
);

create policy "game video stats staff insert"
on public.game_video_stats
for insert
to authenticated
with check ((select public.is_video_staff()));

create policy "game video stats staff update"
on public.game_video_stats
for update
to authenticated
using ((select public.is_video_staff()))
with check ((select public.is_video_staff()));

create policy "game video stats admin delete"
on public.game_video_stats
for delete
to authenticated
using ((select public.is_admin()));

create policy "video highlights staff parent read"
on public.video_highlights
for select
to authenticated
using (
  (select public.is_video_staff())
  or created_by = (select auth.uid())
  or (
    status in ('approved', 'published')
    and visibility in ('parents', 'team', 'public')
    and public.video_highlight_is_for_linked_player(event_id, stat_id)
  )
);

create policy "video highlights staff insert"
on public.video_highlights
for insert
to authenticated
with check ((select public.is_video_staff()));

create policy "video highlights staff update"
on public.video_highlights
for update
to authenticated
using ((select public.is_video_staff()))
with check ((select public.is_video_staff()));

create policy "video highlights admin delete"
on public.video_highlights
for delete
to authenticated
using ((select public.is_admin()));

create policy "video reviews staff read"
on public.video_analysis_reviews
for select
to authenticated
using (
  (select public.is_video_staff())
  or reviewed_by = (select auth.uid())
);

create policy "video reviews staff insert"
on public.video_analysis_reviews
for insert
to authenticated
with check (
  (select public.is_video_staff())
  and reviewed_by = (select auth.uid())
);

create policy "video reviews immutable admin delete"
on public.video_analysis_reviews
for delete
to authenticated
using ((select public.is_admin()));

grant select, insert, update, delete on
  public.video_recording_sessions,
  public.video_recordings,
  public.video_analysis_jobs,
  public.video_events,
  public.game_video_stats,
  public.video_highlights,
  public.video_analysis_reviews
to authenticated;

alter table public.video_recording_sessions replica identity full;
alter table public.video_recordings replica identity full;
alter table public.video_analysis_jobs replica identity full;
alter table public.video_events replica identity full;
alter table public.game_video_stats replica identity full;
alter table public.video_highlights replica identity full;
alter table public.video_analysis_reviews replica identity full;

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'video_recording_sessions',
      'video_recordings',
      'video_analysis_jobs',
      'video_events',
      'game_video_stats',
      'video_highlights',
      'video_analysis_reviews'
    ] loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;
