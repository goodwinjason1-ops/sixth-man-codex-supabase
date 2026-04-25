-- Firestore compatibility layer for the Firebase to Supabase rebuild.
-- Agent B should target public.documents first, then move high-value domains to
-- typed tables incrementally.

create table if not exists public.documents (
  collection text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  primary key (collection, id),
  constraint documents_collection_not_blank check (btrim(collection) <> ''),
  constraint documents_id_not_blank check (btrim(id) <> ''),
  constraint documents_data_is_object check (jsonb_typeof(data) = 'object')
);

comment on table public.documents is
  'Firestore-compatible document store. Each row maps to one legacy Firestore document by collection and id.';
comment on column public.documents.data is
  'Original document payload. Query-critical fields are indexed as JSONB expressions until they are migrated to typed tables.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = coalesce(new.created_at, now());
    new.created_by = coalesce(new.created_by, auth.uid());
  end if;

  new.updated_at = now();
  new.updated_by = coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before insert or update on public.documents
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select d.data->>'role'
      from public.documents as d
      where d.collection = 'users'
        and d.id = (select auth.uid())::text
      limit 1
    ),
    'anonymous'
  );
$$;

create or replace function public.current_user_linked_player_ids()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select array(
        select distinct linked_player_id
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(d.data->'linkedPlayerIds') = 'array' then d.data->'linkedPlayerIds'
            when jsonb_typeof(d.data->'children') = 'array' then d.data->'children'
            else '[]'::jsonb
          end
        ) as linked_player_id
      )
      from public.documents as d
      where d.collection = 'users'
        and d.id = (select auth.uid())::text
      limit 1
    ),
    array[]::text[]
  );
$$;

create or replace function public.current_user_team_ids()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select array(
        select distinct team_id
        from (
          select jsonb_array_elements_text(
            case
              when jsonb_typeof(d.data->'assignedTeams') = 'array' then d.data->'assignedTeams'
              else '[]'::jsonb
            end
          ) as team_id
          union all
          select jsonb_array_elements_text(
            case
              when jsonb_typeof(d.data->'teamIds') = 'array' then d.data->'teamIds'
              else '[]'::jsonb
            end
          ) as team_id
        ) as team_values
      )
      from public.documents as d
      where d.collection = 'users'
        and d.id = (select auth.uid())::text
      limit 1
    ),
    array[]::text[]
  );
$$;

create or replace function public.jsonb_array_contains_text(target jsonb, needle text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    needle is not null
    and jsonb_typeof(target) = 'array'
    and target @> to_jsonb(array[needle]),
    false
  );
$$;

create or replace function public.has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_user_role() = any (allowed_roles);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['admin', 'president', 'vice_president']);
$$;

create or replace function public.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array[
    'admin', 'president', 'vice_president',
    'girls_coordinator', 'boys_coordinator',
    'coach_coordinator', 'youth_head_coach'
  ]);
$$;

create or replace function public.is_tryout_coordinator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array[
    'admin', 'president', 'vice_president',
    'girls_coordinator', 'boys_coordinator',
    'coach_coordinator'
  ]);
$$;

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array[
    'admin', 'president', 'vice_president',
    'girls_coordinator', 'boys_coordinator',
    'coach_coordinator', 'youth_head_coach',
    'coach', 'youth_coach'
  ]);
$$;

create or replace function public.is_tryout_actor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array[
    'admin', 'president', 'vice_president', 'coach_coordinator',
    'girls_coordinator', 'boys_coordinator',
    'coach', 'team_manager', 'tryout_assessor'
  ]);
$$;

create or replace function public.is_video_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_coach()
    or public.is_coordinator()
    or public.has_role(array['team_manager']);
$$;

create or replace function public.user_sensitive_fields_unchanged(document_id text, new_data jsonb)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select not exists (
        select 1
        from unnest(array[
          'role', 'disabled', 'deleted', 'deletedAt', 'deletedBy',
          'disabledAt', 'disabledBy'
        ]) as sensitive_key
        where coalesce(d.data -> sensitive_key, 'null'::jsonb)
          is distinct from coalesce(new_data -> sensitive_key, 'null'::jsonb)
      )
      from public.documents as d
      where d.collection = 'users'
        and d.id = document_id
      limit 1
    ),
    false
  );
$$;

create or replace function public.can_read_document(
  collection_name text,
  document_id text,
  document_data jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid text := (select auth.uid())::text;
  role_name text := public.current_user_role();
begin
  -- Firestore allowed public team reads for registration screens.
  if collection_name = 'teams' then
    return true;
  end if;

  if uid is null then
    return false;
  end if;

  if collection_name in (
    'users', 'players', 'evaluations', 'match_assessments',
    'selection_teams', 'tryout_sessions', 'curriculum',
    'assessment_config', 'attendance', 'schedule', 'games',
    'game_results', 'playing_time', 'notifications', 'swap_requests',
    'scoring_roster', 'scoring_assignments', 'parent_invitations',
    'youth_programs', 'youth_achievements', 'coach_accreditations',
    'assessment_metrics', 'mvp_votes'
  ) then
    return true;
  end if;

  if collection_name = 'beta_feedback' then
    return public.is_admin();
  end if;

  if collection_name in ('training_plans', 'training_sessions', 'drills', 'training_notes', 'training_records') then
    return public.is_coach();
  end if;

  if collection_name = 'development_plans' then
    return public.is_coach()
      or (
        role_name = 'parent'
        and public.jsonb_array_contains_text(document_data->'parentIds', uid)
      );
  end if;

  if collection_name = 'tryout_assessments' then
    return public.is_tryout_coordinator()
      or document_data->>'assessorId' = uid;
  end if;

  if collection_name = 'tryout_evaluations' then
    return public.is_tryout_coordinator()
      or document_data->>'assessorId' = uid;
  end if;

  if collection_name = 'scout_evaluations' then
    return public.is_tryout_coordinator()
      or document_data->>'scoutId' = uid;
  end if;

  if collection_name in (
    'youth_sessions', 'youth_enrollments', 'youth_attendance',
    'youth_milestones', 'youth_parent_messages', 'youth_session_summaries'
  ) then
    -- These collections are used by the app but are not present in firestore.rules.
    -- Keep them staff-only until the parent-facing access model is finalized.
    return public.is_coach() or public.is_coordinator();
  end if;

  if collection_name = 'audit_logs' then
    return public.is_admin();
  end if;

  return false;
end;
$$;

create or replace function public.can_insert_document(
  collection_name text,
  document_id text,
  document_data jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid text := (select auth.uid())::text;
begin
  if uid is null then
    return false;
  end if;

  if collection_name = 'users' then
    return public.is_admin()
      or (
        document_id = uid
        and coalesce(document_data->>'role', 'pending') in ('pending', 'parent', 'player')
        and coalesce(document_data->>'disabled', 'false') <> 'true'
        and coalesce(document_data->>'deleted', 'false') <> 'true'
      );
  end if;

  if collection_name = 'players' then
    return public.is_coach() or public.has_role(array['team_manager']);
  end if;

  if collection_name = 'teams' then
    return public.is_coordinator();
  end if;

  if collection_name in ('evaluations', 'match_assessments') then
    return public.is_coach();
  end if;

  if collection_name = 'beta_feedback' then
    return true;
  end if;

  if collection_name in ('selection_teams', 'curriculum', 'assessment_config', 'parent_invitations', 'assessment_metrics') then
    return public.is_admin();
  end if;

  if collection_name = 'tryout_sessions' then
    return public.is_tryout_coordinator();
  end if;

  if collection_name in ('tryout_assessments', 'tryout_evaluations', 'scout_evaluations') then
    return public.is_tryout_actor();
  end if;

  if collection_name in ('training_plans', 'training_sessions', 'drills', 'training_notes', 'training_records') then
    return public.is_coach();
  end if;

  if collection_name = 'development_plans' then
    return public.is_coach();
  end if;

  if collection_name in (
    'attendance', 'schedule', 'games', 'game_results', 'playing_time',
    'scoring_roster', 'youth_achievements'
  ) then
    return public.is_coach();
  end if;

  if collection_name = 'notifications' then
    return true;
  end if;

  if collection_name in ('swap_requests', 'mvp_votes') then
    return true;
  end if;

  if collection_name = 'scoring_assignments' then
    return public.is_coordinator();
  end if;

  if collection_name = 'youth_programs' then
    return public.is_coordinator();
  end if;

  if collection_name in (
    'youth_sessions', 'youth_enrollments', 'youth_attendance',
    'youth_milestones', 'youth_parent_messages', 'youth_session_summaries'
  ) then
    return public.is_coach() or public.is_coordinator();
  end if;

  if collection_name = 'coach_accreditations' then
    return public.is_coach() or public.is_admin();
  end if;

  if collection_name = 'audit_logs' then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.can_update_document(
  collection_name text,
  document_id text,
  document_data jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid text := (select auth.uid())::text;
begin
  if uid is null then
    return false;
  end if;

  if collection_name = 'users' then
    return public.is_admin()
      or (document_id = uid and public.user_sensitive_fields_unchanged(document_id, document_data));
  end if;

  if collection_name = 'players' then
    return public.is_coach() or public.has_role(array['team_manager']);
  end if;

  if collection_name = 'teams' then
    return public.is_coordinator();
  end if;

  if collection_name in ('evaluations', 'match_assessments') then
    return public.is_admin()
      or (public.is_coach() and document_data->>'coachId' = uid);
  end if;

  if collection_name = 'beta_feedback' then
    return public.is_admin();
  end if;

  if collection_name in ('selection_teams', 'curriculum', 'assessment_config', 'parent_invitations', 'assessment_metrics') then
    return public.is_admin();
  end if;

  if collection_name = 'tryout_sessions' then
    return public.is_tryout_coordinator();
  end if;

  if collection_name = 'tryout_assessments' then
    return document_data->>'assessorId' = uid;
  end if;

  if collection_name = 'tryout_evaluations' then
    return public.is_tryout_coordinator()
      or document_data->>'assessorId' = uid;
  end if;

  if collection_name = 'scout_evaluations' then
    return public.is_tryout_coordinator()
      or document_data->>'scoutId' = uid;
  end if;

  if collection_name = 'training_plans' then
    return public.is_coordinator()
      or (public.is_coach() and document_data->>'coachId' = uid);
  end if;

  if collection_name = 'drills' then
    return public.is_coach()
      and (document_data->>'createdBy' = uid or public.is_coordinator());
  end if;

  if collection_name in ('training_sessions', 'training_notes', 'training_records') then
    return public.is_coach();
  end if;

  if collection_name = 'development_plans' then
    return public.is_coach();
  end if;

  if collection_name in (
    'attendance', 'schedule', 'games', 'game_results', 'playing_time',
    'scoring_roster', 'youth_achievements'
  ) then
    return public.is_coach() or public.is_coordinator();
  end if;

  if collection_name = 'notifications' then
    return true;
  end if;

  if collection_name = 'swap_requests' then
    return document_data->>'requestingParentId' = uid
      or document_data->>'targetParentId' = uid
      or public.is_coordinator();
  end if;

  if collection_name = 'scoring_assignments' then
    return public.is_coordinator();
  end if;

  if collection_name = 'youth_programs' then
    return public.is_coordinator();
  end if;

  if collection_name in (
    'youth_sessions', 'youth_enrollments', 'youth_attendance',
    'youth_milestones', 'youth_parent_messages', 'youth_session_summaries'
  ) then
    return public.is_coach() or public.is_coordinator();
  end if;

  if collection_name = 'coach_accreditations' then
    return public.is_admin()
      or (public.is_coach() and document_data->>'coachId' = uid);
  end if;

  if collection_name = 'mvp_votes' then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.can_delete_document(
  collection_name text,
  document_id text,
  document_data jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  if collection_name = 'audit_logs' then
    return false;
  end if;

  return public.is_admin();
end;
$$;

alter table public.documents enable row level security;
alter table public.documents force row level security;

create policy "documents_select_by_legacy_rules"
on public.documents
for select
to anon, authenticated
using ((select public.can_read_document(collection, id, data)));

create policy "documents_insert_by_legacy_rules"
on public.documents
for insert
to authenticated
with check ((select public.can_insert_document(collection, id, data)));

create policy "documents_update_by_legacy_rules"
on public.documents
for update
to authenticated
using ((select public.can_update_document(collection, id, data)))
with check ((select public.can_update_document(collection, id, data)));

create policy "documents_delete_by_legacy_rules"
on public.documents
for delete
to authenticated
using ((select public.can_delete_document(collection, id, data)));

grant select on public.documents to anon, authenticated;
grant insert, update, delete on public.documents to authenticated;

create index if not exists documents_collection_idx
  on public.documents (collection);
create index if not exists documents_collection_created_at_idx
  on public.documents (collection, created_at desc);
create index if not exists documents_collection_updated_at_idx
  on public.documents (collection, updated_at desc);
create index if not exists documents_data_gin_idx
  on public.documents using gin (data jsonb_path_ops);

create index if not exists documents_team_id_idx
  on public.documents (collection, (data->>'teamId')) where data ? 'teamId';
create index if not exists documents_coach_id_idx
  on public.documents (collection, (data->>'coachId')) where data ? 'coachId';
create index if not exists documents_player_id_idx
  on public.documents (collection, (data->>'playerId')) where data ? 'playerId';
create index if not exists documents_date_idx
  on public.documents (collection, (data->>'date')) where data ? 'date';
create index if not exists documents_updated_at_json_idx
  on public.documents (collection, (data->>'updatedAt')) where data ? 'updatedAt';
create index if not exists documents_created_at_json_idx
  on public.documents (collection, (data->>'createdAt')) where data ? 'createdAt';
create index if not exists documents_status_idx
  on public.documents (collection, (data->>'status')) where data ? 'status';
create index if not exists documents_assessor_id_idx
  on public.documents (collection, (data->>'assessorId')) where data ? 'assessorId';
create index if not exists documents_scout_id_idx
  on public.documents (collection, (data->>'scoutId')) where data ? 'scoutId';
create index if not exists documents_game_id_idx
  on public.documents (collection, (data->>'gameId')) where data ? 'gameId';
create index if not exists documents_email_idx
  on public.documents (collection, lower(data->>'email')) where data ? 'email';
create index if not exists documents_role_idx
  on public.documents (collection, (data->>'role')) where data ? 'role';
create index if not exists documents_program_id_idx
  on public.documents (collection, (data->>'programId')) where data ? 'programId';
create index if not exists documents_session_id_idx
  on public.documents (collection, (data->>'sessionId')) where data ? 'sessionId';
create index if not exists documents_enrollment_id_idx
  on public.documents (collection, (data->>'enrollmentId')) where data ? 'enrollmentId';
create index if not exists documents_invitation_code_idx
  on public.documents (collection, (data->>'invitationCode')) where data ? 'invitationCode';
create index if not exists documents_child_name_idx
  on public.documents (collection, lower(data->>'childName')) where data ? 'childName';
create index if not exists documents_week_number_idx
  on public.documents (collection, (data->>'weekNumber')) where data ? 'weekNumber';

create index if not exists documents_assigned_teams_gin_idx
  on public.documents using gin ((data->'assignedTeams')) where data ? 'assignedTeams';
create index if not exists documents_linked_player_ids_gin_idx
  on public.documents using gin ((data->'linkedPlayerIds')) where data ? 'linkedPlayerIds';
create index if not exists documents_parent_ids_gin_idx
  on public.documents using gin ((data->'parentIds')) where data ? 'parentIds';
create index if not exists documents_player_ids_gin_idx
  on public.documents using gin ((data->'playerIds')) where data ? 'playerIds';

alter table public.documents replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'documents'
    ) then
    execute 'alter publication supabase_realtime add table public.documents';
  end if;
end;
$$;
