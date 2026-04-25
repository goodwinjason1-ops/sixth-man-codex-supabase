-- Parent invitation and profile hardening.
-- Keeps the Firestore-compatible documents table, but moves public invitation
-- lookup and parent profile linking into server-side RPCs.

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
          'disabledAt', 'disabledBy', 'linkedPlayerIds', 'children',
          'assignedTeams', 'teamIds', 'playerId', 'teamId',
          'invitationCode', 'acceptedInvitationCode'
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
        and coalesce(document_data->>'role', 'pending') = 'pending'
        and coalesce(document_data->>'disabled', 'false') <> 'true'
        and coalesce(document_data->>'deleted', 'false') <> 'true'
        and not (document_data ?| array[
          'linkedPlayerIds', 'children', 'assignedTeams', 'teamIds',
          'playerId', 'teamId', 'invitationCode', 'acceptedInvitationCode'
        ])
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

create or replace function public.validate_parent_invitation(invitation_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_code text := upper(btrim(coalesce(invitation_code, '')));
  invitation_row public.documents%rowtype;
  expires_at timestamptz;
  player_ids jsonb := '[]'::jsonb;
  player_names jsonb := '[]'::jsonb;
begin
  if normalized_code = '' then
    return jsonb_build_object(
      'valid', false,
      'error', 'Invalid invitation code. Please check your invitation email.'
    );
  end if;

  select *
  into invitation_row
  from public.documents
  where collection = 'parent_invitations'
    and upper(data->>'invitationCode') = normalized_code
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'valid', false,
      'error', 'Invalid invitation code. Please check your invitation email.'
    );
  end if;

  if invitation_row.data->>'status' = 'accepted' then
    return jsonb_build_object('valid', false, 'error', 'This invitation has already been used.');
  end if;

  if invitation_row.data->>'status' = 'revoked' then
    return jsonb_build_object(
      'valid', false,
      'error', 'This invitation has been revoked. Please contact your club administrator.'
    );
  end if;

  if coalesce(invitation_row.data->>'status', '') <> 'pending' then
    return jsonb_build_object('valid', false, 'error', 'This invitation is no longer valid.');
  end if;

  if nullif(invitation_row.data->>'expiresAt', '') is not null then
    begin
      expires_at := (invitation_row.data->>'expiresAt')::timestamptz;
    exception when others then
      expires_at := null;
    end;

    if expires_at is not null and expires_at < now() then
      return jsonb_build_object(
        'valid', false,
        'error', 'This invitation has expired. Please contact your club administrator for a new one.'
      );
    end if;
  end if;

  player_ids := case
    when jsonb_typeof(invitation_row.data->'playerIds') = 'array' then invitation_row.data->'playerIds'
    else '[]'::jsonb
  end;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', coalesce(
          nullif(p.data->>'name', ''),
          nullif(p.data->>'displayName', ''),
          nullif(btrim(coalesce(p.data->>'firstName', '') || ' ' || coalesce(p.data->>'lastName', '')), ''),
          'Unknown'
        )
      )
      order by coalesce(p.data->>'name', p.data->>'displayName', p.id)
    ),
    '[]'::jsonb
  )
  into player_names
  from public.documents as p
  where p.collection = 'players'
    and p.id in (
      select player_id
      from jsonb_array_elements_text(player_ids) as player_values(player_id)
    );

  return jsonb_build_object(
    'valid', true,
    'invitation', jsonb_build_object(
      'id', invitation_row.id,
      'invitationCode', invitation_row.data->>'invitationCode',
      'playerIds', player_ids,
      'playerNames', player_names,
      'parentEmail', coalesce(invitation_row.data->>'parentEmail', ''),
      'parentName', coalesce(invitation_row.data->>'parentName', ''),
      'status', invitation_row.data->>'status',
      'expiresAt', invitation_row.data->>'expiresAt'
    )
  );
end;
$$;

create or replace function public.accept_parent_invitation(
  invitation_code text,
  display_name text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  uid_text text := uid::text;
  normalized_code text := upper(btrim(coalesce(invitation_code, '')));
  auth_email text;
  auth_metadata jsonb := '{}'::jsonb;
  invitation_row public.documents%rowtype;
  invitation_email text;
  expires_at timestamptz;
  player_ids jsonb := '[]'::jsonb;
  existing_profile jsonb := '{}'::jsonb;
  existing_role text;
  merged_player_ids jsonb := '[]'::jsonb;
  profile_display_name text;
  profile jsonb;
  player_id text;
begin
  if uid is null then
    return jsonb_build_object('success', false, 'error', 'auth-required');
  end if;

  if normalized_code = '' then
    return jsonb_build_object('success', false, 'error', 'invalid-invitation');
  end if;

  select email, coalesce(raw_user_meta_data, '{}'::jsonb)
  into auth_email, auth_metadata
  from auth.users
  where id = uid;

  select *
  into invitation_row
  from public.documents
  where collection = 'parent_invitations'
    and upper(data->>'invitationCode') = normalized_code
  order by created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'invalid-invitation');
  end if;

  if coalesce(invitation_row.data->>'status', '') <> 'pending' then
    return jsonb_build_object('success', false, 'error', 'invitation-not-pending');
  end if;

  if nullif(invitation_row.data->>'expiresAt', '') is not null then
    begin
      expires_at := (invitation_row.data->>'expiresAt')::timestamptz;
    exception when others then
      expires_at := null;
    end;

    if expires_at is not null and expires_at < now() then
      return jsonb_build_object('success', false, 'error', 'invitation-expired');
    end if;
  end if;

  invitation_email := lower(btrim(coalesce(invitation_row.data->>'parentEmail', '')));
  if invitation_email <> '' and lower(coalesce(auth_email, '')) <> invitation_email then
    return jsonb_build_object('success', false, 'error', 'google-email-mismatch');
  end if;

  player_ids := case
    when jsonb_typeof(invitation_row.data->'playerIds') = 'array' then invitation_row.data->'playerIds'
    else '[]'::jsonb
  end;

  select coalesce(d.data, '{}'::jsonb)
  into existing_profile
  from public.documents as d
  where d.collection = 'users'
    and d.id = uid_text
  limit 1;

  existing_profile := coalesce(existing_profile, '{}'::jsonb);
  existing_role := coalesce(existing_profile->>'role', 'pending');

  if existing_profile <> '{}'::jsonb and existing_role not in ('pending', 'parent') then
    return jsonb_build_object('success', false, 'error', 'account-has-existing-role');
  end if;

  select coalesce(jsonb_agg(to_jsonb(player_value) order by player_value), '[]'::jsonb)
  into merged_player_ids
  from (
    select value as player_value
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(existing_profile->'linkedPlayerIds') = 'array' then existing_profile->'linkedPlayerIds'
        else '[]'::jsonb
      end
    )
    union
    select value as player_value
    from jsonb_array_elements_text(player_ids)
  ) as player_values
  where player_value <> '';

  profile_display_name := coalesce(
    nullif(btrim(display_name), ''),
    nullif(existing_profile->>'displayName', ''),
    nullif(invitation_row.data->>'parentName', ''),
    nullif(auth_metadata->>'display_name', ''),
    nullif(auth_metadata->>'full_name', ''),
    nullif(auth_metadata->>'name', ''),
    auth_email,
    ''
  );

  profile := existing_profile || jsonb_build_object(
    'uid', uid_text,
    'email', coalesce(auth_email, existing_profile->>'email', ''),
    'displayName', profile_display_name,
    'role', 'parent',
    'linkedPlayerIds', merged_player_ids,
    'invitationCode', normalized_code,
    'createdAt', coalesce(existing_profile->>'createdAt', now()::text),
    'photoURL', coalesce(
      existing_profile->>'photoURL',
      auth_metadata->>'avatar_url',
      auth_metadata->>'picture'
    )
  );

  insert into public.documents (collection, id, data, created_by, updated_by)
  values ('users', uid_text, profile, uid, uid)
  on conflict (collection, id) do update
  set data = excluded.data,
      updated_at = now(),
      updated_by = uid;

  update public.documents
  set data = data || jsonb_build_object(
      'status', 'accepted',
      'acceptedBy', uid_text,
      'acceptedAt', now()
    ),
    updated_at = now(),
    updated_by = uid
  where collection = 'parent_invitations'
    and id = invitation_row.id;

  for player_id in
    select value
    from jsonb_array_elements_text(player_ids)
  loop
    update public.documents as p
    set data = jsonb_set(
        p.data,
        '{linkedParentIds}',
        coalesce((
          select jsonb_agg(to_jsonb(parent_value) order by parent_value)
          from (
            select value as parent_value
            from jsonb_array_elements_text(
              case
                when jsonb_typeof(p.data->'linkedParentIds') = 'array' then p.data->'linkedParentIds'
                else '[]'::jsonb
              end
            )
            union
            select uid_text as parent_value
          ) as parent_values
          where parent_value <> ''
        ), '[]'::jsonb),
        true
      ),
      updated_at = now(),
      updated_by = uid
    where p.collection = 'players'
      and p.id = player_id;
  end loop;

  return jsonb_build_object(
    'success', true,
    'profile', profile,
    'invitation', jsonb_build_object(
      'id', invitation_row.id,
      'invitationCode', normalized_code,
      'playerIds', player_ids
    )
  );
end;
$$;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'club-assets';

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
      and mime_type = any (array['image/jpeg', 'image/png', 'image/webp'])
      and object_extension = any (array['jpg', 'jpeg', 'png', 'webp'])
      and size_bytes <= 20971520;
  end if;

  return false;
end;
$$;

revoke execute on function public.accept_parent_invitation(text, text) from public;
grant execute on function public.validate_parent_invitation(text) to anon, authenticated, service_role;
grant execute on function public.accept_parent_invitation(text, text) to authenticated, service_role;

comment on function public.validate_parent_invitation(text) is
  'Public-safe parent invitation lookup. Returns only the matching invitation and safe player display names.';
comment on function public.accept_parent_invitation(text, text) is
  'Authenticated server-side parent invitation acceptance. Validates email/status/expiry, creates the parent profile, marks the invitation accepted, and links players atomically.';
