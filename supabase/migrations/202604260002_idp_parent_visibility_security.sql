-- Harden parent access for Firestore-compatible IDP documents.
-- Parents may read development plans only when staff explicitly share the plan
-- and the plan includes the signed-in parent in parentIds.

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

  if collection_name = 'users' then
    return document_id = uid
      or public.is_admin()
      or public.is_coordinator()
      or public.is_coach()
      or public.has_role(array['team_manager']);
  end if;

  if role_name = 'pending' then
    return false;
  end if;

  if collection_name = 'parent_invitations' then
    return public.is_admin();
  end if;

  if collection_name in (
    'players', 'evaluations', 'match_assessments',
    'selection_teams', 'tryout_sessions', 'curriculum',
    'assessment_config', 'attendance', 'schedule', 'games',
    'game_results', 'playing_time', 'notifications', 'swap_requests',
    'scoring_roster', 'scoring_assignments', 'youth_programs',
    'youth_achievements', 'coach_accreditations', 'assessment_metrics',
    'mvp_votes'
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
        and coalesce(document_data->>'parentVisible', 'false') = 'true'
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
    return public.is_coach() or public.is_coordinator();
  end if;

  if collection_name = 'audit_logs' then
    return public.is_admin();
  end if;

  return false;
end;
$$;

comment on function public.can_read_document(text, text, jsonb) is
  'Documents compatibility read guard. Development-plan parent reads require parentVisible=true and parentIds containing auth.uid().';

create index if not exists documents_development_plans_parent_ids_visible_gin_idx
  on public.documents using gin ((data->'parentIds'))
  where collection = 'development_plans'
    and data ? 'parentIds'
    and coalesce(data->>'parentVisible', 'false') = 'true';

create or replace function public.log_development_plan_document_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_key text;
begin
  if tg_op = 'DELETE' then
    if old.collection <> 'development_plans' then
      return old;
    end if;
    row_key := old.collection || '/' || old.id;
  else
    if new.collection <> 'development_plans' then
      return new;
    end if;
    row_key := new.collection || '/' || new.id;
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
      'trigger_name', tg_name,
      'collection', 'development_plans'
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists documents_development_plans_security_audit on public.documents;
create trigger documents_development_plans_security_audit
after insert or update or delete on public.documents
for each row execute function public.log_development_plan_document_audit_event();

do $$
begin
  if not exists (
    select 1
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'documents'
      and c.relrowsecurity
      and c.relforcerowsecurity
  ) then
    raise exception 'public.documents must have enabled and forced RLS for IDP parent visibility';
  end if;
end;
$$;
