-- Profile avatars, community images, challenge cover + gallery, Supabase Storage buckets.
-- Run once in Supabase SQL Editor (empty tab, full file).

alter table public.profiles
  add column if not exists avatar_url text;

create table if not exists public.challenge_photos (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists challenge_photos_challenge_id_idx
  on public.challenge_photos (challenge_id, sort_order);

alter table public.challenge_photos enable row level security;

create policy "Challenge photos readable with challenge"
  on public.challenge_photos for select
  using (
    exists (
      select 1
      from public.challenges c
      where c.id = challenge_id
        and (
          c.visibility = 'public'
          or c.created_by = auth.uid()
          or exists (
            select 1
            from public.challenge_participants cp
            where cp.challenge_id = c.id and cp.user_id = auth.uid()
          )
        )
    )
  );

create policy "Creators manage challenge photos"
  on public.challenge_photos for all
  using (
    exists (
      select 1
      from public.challenges c
      where c.id = challenge_id and c.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.challenges c
      where c.id = challenge_id and c.created_by = auth.uid()
    )
  );

-- Storage buckets (public CDN URLs for profile + public challenge pages)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'community-media',
    'community-media',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'challenge-media',
    'challenge-media',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Avatars: path {user_id}/avatar.{ext}
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Community media: path {owner_id}/avatar|banner.{ext}
create policy "Community media publicly readable"
  on storage.objects for select
  using (bucket_id = 'community-media');

create policy "Creators upload community media"
  on storage.objects for insert
  with check (
    bucket_id = 'community-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Creators update community media"
  on storage.objects for update
  using (
    bucket_id = 'community-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Creators delete community media"
  on storage.objects for delete
  using (
    bucket_id = 'community-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Challenge media: path {creator_id}/{challenge_id}/cover|gallery-{id}.{ext}
create policy "Challenge media publicly readable"
  on storage.objects for select
  using (bucket_id = 'challenge-media');

create policy "Creators upload challenge media"
  on storage.objects for insert
  with check (
    bucket_id = 'challenge-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Creators update challenge media"
  on storage.objects for update
  using (
    bucket_id = 'challenge-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Creators delete challenge media"
  on storage.objects for delete
  using (
    bucket_id = 'challenge-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
