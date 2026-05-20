-- Allow staff-routed tactical playboards through the Firestore-compatible
-- public.documents table without broadening the legacy document guards.

drop policy if exists "documents_playboards_staff_select" on public.documents;
drop policy if exists "documents_playboards_staff_insert" on public.documents;
drop policy if exists "documents_playboards_staff_update" on public.documents;

create policy "documents_playboards_staff_select"
on public.documents
for select
to authenticated
using (
  collection = 'playboards'
  and public.has_role(array['admin', 'president', 'vice_president', 'coach_coordinator', 'coach'])
);

create policy "documents_playboards_staff_insert"
on public.documents
for insert
to authenticated
with check (
  collection = 'playboards'
  and public.has_role(array['admin', 'president', 'vice_president', 'coach_coordinator', 'coach'])
);

create policy "documents_playboards_staff_update"
on public.documents
for update
to authenticated
using (
  collection = 'playboards'
  and public.has_role(array['admin', 'president', 'vice_president', 'coach_coordinator', 'coach'])
  and (
    public.is_coordinator()
    or data->>'coachId' = (select auth.uid())::text
    or data->>'createdBy' = (select auth.uid())::text
  )
)
with check (
  collection = 'playboards'
  and public.has_role(array['admin', 'president', 'vice_president', 'coach_coordinator', 'coach'])
  and (
    public.is_coordinator()
    or data->>'coachId' = (select auth.uid())::text
    or data->>'createdBy' = (select auth.uid())::text
  )
);

create index if not exists documents_playboards_source_drill_id_idx
  on public.documents (collection, (data->'sourceRefs'->>'drillId'))
  where collection = 'playboards';

create index if not exists documents_playboards_source_training_plan_id_idx
  on public.documents (collection, (data->'sourceRefs'->>'trainingPlanId'))
  where collection = 'playboards';
