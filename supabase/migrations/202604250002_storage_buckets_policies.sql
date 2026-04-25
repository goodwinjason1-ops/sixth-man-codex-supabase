-- Supabase Storage replacement for Firebase Storage.
-- Existing Firebase behavior: authenticated feedback image uploads/read under
-- feedback/{feedbackId}/..., max 5 MB. Video buckets are new and private.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'feedback-screenshots',
    'feedback-screenshots',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  ),
  (
    'game-videos',
    'game-videos',
    false,
    10737418240,
    array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'application/octet-stream']::text[]
  ),
  (
    'video-recordings',
    'video-recordings',
    false,
    10737418240,
    array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'application/octet-stream']::text[]
  ),
  (
    'club-assets',
    'club-assets',
    true,
    20971520,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']::text[]
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "feedback screenshots authenticated read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'feedback-screenshots'
  and name like 'feedback/%'
);

create policy "feedback screenshots authenticated upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'feedback-screenshots'
  and name like 'feedback/%'
  and owner = (select auth.uid())
  and coalesce(metadata->>'mimetype', '') like 'image/%'
  and coalesce(nullif(metadata->>'size', '')::bigint, 0) <= 5242880
);

create policy "feedback screenshots owner update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'feedback-screenshots'
  and name like 'feedback/%'
  and owner = (select auth.uid())
)
with check (
  bucket_id = 'feedback-screenshots'
  and name like 'feedback/%'
  and owner = (select auth.uid())
  and coalesce(metadata->>'mimetype', '') like 'image/%'
  and coalesce(nullif(metadata->>'size', '')::bigint, 0) <= 5242880
);

create policy "feedback screenshots owner delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'feedback-screenshots'
  and name like 'feedback/%'
  and owner = (select auth.uid())
);

create policy "private videos staff read"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('game-videos', 'video-recordings')
  and (
    owner = (select auth.uid())
    or (select public.is_video_staff())
  )
);

create policy "private videos staff upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('game-videos', 'video-recordings')
  and owner = (select auth.uid())
  and (select public.is_video_staff())
  and coalesce(metadata->>'mimetype', '') in (
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    'application/octet-stream'
  )
  and coalesce(nullif(metadata->>'size', '')::bigint, 0) <= 10737418240
);

create policy "private videos staff update"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('game-videos', 'video-recordings')
  and (
    owner = (select auth.uid())
    or (select public.is_admin())
    or (select public.is_coordinator())
  )
)
with check (
  bucket_id in ('game-videos', 'video-recordings')
  and (
    owner = (select auth.uid())
    or (select public.is_admin())
    or (select public.is_coordinator())
  )
  and coalesce(metadata->>'mimetype', '') in (
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    'application/octet-stream'
  )
  and coalesce(nullif(metadata->>'size', '')::bigint, 0) <= 10737418240
);

create policy "private videos staff delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('game-videos', 'video-recordings')
  and (
    owner = (select auth.uid())
    or (select public.is_admin())
    or (select public.is_coordinator())
  )
);

create policy "club assets public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'club-assets');

create policy "club assets coordinator upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'club-assets'
  and ((select public.is_admin()) or (select public.is_coordinator()))
);

create policy "club assets coordinator update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'club-assets'
  and ((select public.is_admin()) or (select public.is_coordinator()))
)
with check (
  bucket_id = 'club-assets'
  and ((select public.is_admin()) or (select public.is_coordinator()))
);

create policy "club assets coordinator delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'club-assets'
  and ((select public.is_admin()) or (select public.is_coordinator()))
);
