-- Keep video_analysis_jobs compatible with the shared set_updated_at trigger.
-- Jobs already track requested_by; created_by gives the generic trigger and audit
-- trail the same column contract as the other video pipeline tables.

alter table public.video_analysis_jobs
  add column if not exists created_by uuid default auth.uid() references auth.users (id) on delete set null;

update public.video_analysis_jobs
set created_by = coalesce(created_by, requested_by)
where created_by is null;

create index if not exists video_analysis_jobs_created_by_idx
  on public.video_analysis_jobs (created_by)
  where created_by is not null;

comment on column public.video_analysis_jobs.created_by is
  'User who created the analysis job request; mirrors requested_by for trigger/audit compatibility.';
