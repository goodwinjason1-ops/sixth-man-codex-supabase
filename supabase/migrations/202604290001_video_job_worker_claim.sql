-- Service-role helper for safely claiming queued video analysis jobs.
-- The Edge Function calls this RPC so concurrent workers do not process the same row.

create or replace function public.claim_video_analysis_jobs(
  p_worker_id text,
  p_batch_size integer default 3,
  p_job_id uuid default null
)
returns setof public.video_analysis_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nullif(btrim(coalesce(p_worker_id, '')), '') is null then
    raise exception 'p_worker_id is required';
  end if;

  return query
  with candidate_jobs as (
    select j.id
    from public.video_analysis_jobs as j
    where j.status = 'queued'
      and j.attempts < j.max_attempts
      and (p_job_id is null or j.id = p_job_id)
    order by j.priority asc, j.created_at asc
    limit least(greatest(coalesce(p_batch_size, 3), 1), 10)
    for update skip locked
  )
  update public.video_analysis_jobs as j
  set
    status = 'running',
    locked_by = p_worker_id,
    locked_at = now(),
    started_at = coalesce(j.started_at, now()),
    attempts = j.attempts + 1,
    error_message = null,
    updated_at = now()
  from candidate_jobs
  where j.id = candidate_jobs.id
  returning j.*;
end;
$$;

revoke all on function public.claim_video_analysis_jobs(text, integer, uuid) from public;
revoke all on function public.claim_video_analysis_jobs(text, integer, uuid) from anon;
revoke all on function public.claim_video_analysis_jobs(text, integer, uuid) from authenticated;
grant execute on function public.claim_video_analysis_jobs(text, integer, uuid) to service_role;
