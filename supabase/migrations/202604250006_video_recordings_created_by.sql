-- Keep video_recordings compatible with the shared set_updated_at trigger.
-- uploaded_by remains the workflow-specific field; created_by gives the
-- generic trigger and audit trail the same column contract as other tables.

alter table public.video_recordings
  add column if not exists created_by uuid default auth.uid() references auth.users (id) on delete set null;

update public.video_recordings
set created_by = coalesce(created_by, uploaded_by)
where created_by is null;

create index if not exists video_recordings_created_by_idx
  on public.video_recordings (created_by)
  where created_by is not null;

comment on column public.video_recordings.created_by is
  'User who created the recording metadata row; mirrors uploaded_by for trigger/audit compatibility.';
