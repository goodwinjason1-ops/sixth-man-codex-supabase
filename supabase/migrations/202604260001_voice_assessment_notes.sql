-- Voice note intake and AI extraction staging for match/training assessments.
-- Client UI can capture/apply parsed values immediately; these tables support
-- later server-side transcription and review without exposing provider secrets.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.voice_assessment_notes (
  id uuid primary key default gen_random_uuid(),
  assessment_type text not null
    check (assessment_type in ('match', 'training')),
  target_collection text not null
    check (target_collection in ('match_assessments', 'training_records')),
  target_id text,
  game_id text,
  team_id text,
  transcript text not null default '',
  audio_bucket_id text,
  audio_object_path text,
  status text not null default 'queued'
    check (status in ('queued', 'transcribed', 'mapped', 'applied', 'failed', 'archived')),
  provider text,
  model text,
  language text default 'en',
  error_message text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_assessment_extractions (
  id uuid primary key default gen_random_uuid(),
  voice_note_id uuid not null references public.voice_assessment_notes (id) on delete cascade,
  player_id text not null,
  player_name text,
  metric_id text not null,
  metric_name text,
  score numeric(4,2) not null check (score >= 1 and score <= 5),
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  source_text text,
  status text not null default 'detected'
    check (status in ('detected', 'applied', 'rejected', 'corrected')),
  applied_target_collection text check (applied_target_collection in ('match_assessments', 'training_records')),
  applied_target_id text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.voice_assessment_notes is
  'Coach voice note transcript queue for match and training assessment capture.';
comment on table public.voice_assessment_extractions is
  'Player/metric/score values extracted from voice assessment notes before or after coach application.';

create index if not exists voice_assessment_notes_type_status_idx
  on public.voice_assessment_notes (assessment_type, status, created_at desc);
create index if not exists voice_assessment_notes_target_idx
  on public.voice_assessment_notes (target_collection, target_id)
  where target_id is not null;
create index if not exists voice_assessment_notes_game_idx
  on public.voice_assessment_notes (game_id)
  where game_id is not null;
create index if not exists voice_assessment_notes_team_idx
  on public.voice_assessment_notes (team_id, created_at desc)
  where team_id is not null;
create index if not exists voice_assessment_notes_created_by_idx
  on public.voice_assessment_notes (created_by, created_at desc)
  where created_by is not null;

create index if not exists voice_assessment_extractions_note_idx
  on public.voice_assessment_extractions (voice_note_id);
create index if not exists voice_assessment_extractions_player_idx
  on public.voice_assessment_extractions (player_id, created_at desc);
create index if not exists voice_assessment_extractions_metric_idx
  on public.voice_assessment_extractions (metric_id, created_at desc);
create index if not exists voice_assessment_extractions_target_idx
  on public.voice_assessment_extractions (applied_target_collection, applied_target_id)
  where applied_target_id is not null;

drop trigger if exists voice_assessment_notes_set_updated_at on public.voice_assessment_notes;
create trigger voice_assessment_notes_set_updated_at
before insert or update on public.voice_assessment_notes
for each row execute function public.set_updated_at();

drop trigger if exists voice_assessment_extractions_set_updated_at on public.voice_assessment_extractions;
create trigger voice_assessment_extractions_set_updated_at
before insert or update on public.voice_assessment_extractions
for each row execute function public.set_updated_at();

alter table public.voice_assessment_notes enable row level security;
alter table public.voice_assessment_extractions enable row level security;
alter table public.voice_assessment_notes force row level security;
alter table public.voice_assessment_extractions force row level security;

create policy "voice notes staff or owner read"
on public.voice_assessment_notes
for select
to authenticated
using (
  (select public.is_admin())
  or (select public.is_coordinator())
  or (select public.has_role(array['coach', 'youth_coach', 'youth_head_coach', 'team_manager']))
  or created_by = (select auth.uid())
);

create policy "voice notes staff insert"
on public.voice_assessment_notes
for insert
to authenticated
with check (
  (
    (select public.is_admin())
    or (select public.is_coordinator())
    or (select public.has_role(array['coach', 'youth_coach', 'youth_head_coach', 'team_manager']))
  )
  and created_by = (select auth.uid())
);

create policy "voice notes staff update"
on public.voice_assessment_notes
for update
to authenticated
using (
  (select public.is_admin())
  or (select public.is_coordinator())
  or created_by = (select auth.uid())
)
with check (
  (select public.is_admin())
  or (select public.is_coordinator())
  or created_by = (select auth.uid())
);

create policy "voice notes admin delete"
on public.voice_assessment_notes
for delete
to authenticated
using ((select public.is_admin()));

create policy "voice extractions staff or owner read"
on public.voice_assessment_extractions
for select
to authenticated
using (
  (select public.is_admin())
  or (select public.is_coordinator())
  or exists (
    select 1
    from public.voice_assessment_notes as note
    where note.id = voice_note_id
      and (
        note.created_by = (select auth.uid())
        or (select public.has_role(array['coach', 'youth_coach', 'youth_head_coach', 'team_manager']))
      )
  )
);

create policy "voice extractions staff insert"
on public.voice_assessment_extractions
for insert
to authenticated
with check (
  (
    (select public.is_admin())
    or (select public.is_coordinator())
    or (select public.has_role(array['coach', 'youth_coach', 'youth_head_coach', 'team_manager']))
  )
  and created_by = (select auth.uid())
);

create policy "voice extractions staff update"
on public.voice_assessment_extractions
for update
to authenticated
using (
  (select public.is_admin())
  or (select public.is_coordinator())
  or created_by = (select auth.uid())
)
with check (
  (select public.is_admin())
  or (select public.is_coordinator())
  or created_by = (select auth.uid())
);

create policy "voice extractions admin delete"
on public.voice_assessment_extractions
for delete
to authenticated
using ((select public.is_admin()));

grant select, insert, update, delete on
  public.voice_assessment_notes,
  public.voice_assessment_extractions
to authenticated;

alter table public.voice_assessment_notes replica identity full;
alter table public.voice_assessment_extractions replica identity full;

