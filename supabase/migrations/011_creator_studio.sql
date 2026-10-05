-- Creator Studio: challenge lifecycle, schedule, announcements, links (no accountability groups).

do $$ begin
  create type public.challenge_publish_status as enum (
    'draft', 'scheduled', 'published', 'archived'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.challenges
  add column if not exists publish_status public.challenge_publish_status not null default 'published',
  add column if not exists category text,
  add column if not exists short_description text,
  add column if not exists goal_description text,
  add column if not exists published_at timestamptz,
  add column if not exists duplicated_from_id uuid references public.challenges (id) on delete set null;

update public.challenges
set
  publish_status = 'published',
  published_at = coalesce(published_at, created_at)
where published_at is null and publish_status = 'published';

create index if not exists challenges_community_publish_idx
  on public.challenges (community_id, publish_status, start_date);

-- Daily / weekly activity plan (creator-authored; not member health data)
create table if not exists public.challenge_schedule_items (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  sort_order int not null default 0,
  day_label text not null default '',
  title text not null,
  body text,
  is_rest boolean not null default false,
  week_theme text,
  created_at timestamptz not null default now()
);

create index if not exists challenge_schedule_items_challenge_idx
  on public.challenge_schedule_items (challenge_id, sort_order);

alter table public.challenge_schedule_items enable row level security;

create or replace function public.creator_owns_challenge(ch_id uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.challenges c
    where c.id = ch_id and c.created_by = uid
  );
$$;

create or replace function public.user_can_read_challenge(ch_id uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.challenges c
    where c.id = ch_id
      and (
        c.created_by = uid
        or (
          c.visibility = 'public'
          and c.publish_status in ('published', 'scheduled', 'archived')
        )
        or exists (
          select 1 from public.challenge_participants cp
          where cp.challenge_id = c.id and cp.user_id = uid
        )
      )
  );
$$;

grant execute on function public.creator_owns_challenge(uuid, uuid) to authenticated;
grant execute on function public.user_can_read_challenge(uuid, uuid) to authenticated;

drop policy if exists "Public challenges readable by all" on public.challenges;

create policy "Challenges readable"
  on public.challenges for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = id and cp.user_id = auth.uid()
    )
    or (
      visibility = 'public'
      and publish_status in ('published', 'scheduled', 'archived')
    )
  );

create policy "Creators manage schedule items"
  on public.challenge_schedule_items for all
  using (public.creator_owns_challenge(challenge_id, auth.uid()))
  with check (public.creator_owns_challenge(challenge_id, auth.uid()));

create policy "Participants read schedule for joined challenges"
  on public.challenge_schedule_items for select
  using (public.user_can_read_challenge(challenge_id, auth.uid()));

-- Announcements (community and/or challenge scoped)
create table if not exists public.creator_announcements (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.creator_communities (id) on delete cascade,
  challenge_id uuid references public.challenges (id) on delete cascade,
  title text not null,
  body text not null,
  image_url text,
  publish_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists creator_announcements_community_idx
  on public.creator_announcements (community_id, publish_at desc);

alter table public.creator_announcements enable row level security;

create or replace function public.creator_owns_community(com_id uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.creator_communities cc
    where cc.id = com_id and cc.owner_id = uid
  );
$$;

grant execute on function public.creator_owns_community(uuid, uuid) to authenticated;

create policy "Creators manage own announcements"
  on public.creator_announcements for all
  using (public.creator_owns_community(community_id, auth.uid()))
  with check (public.creator_owns_community(community_id, auth.uid()));

create policy "Members read published announcements"
  on public.creator_announcements for select
  using (
    publish_at <= now()
    and (
      public.creator_owns_community(community_id, auth.uid())
      or exists (
        select 1 from public.community_follows cf
        where cf.community_id = creator_announcements.community_id
          and cf.user_id = auth.uid()
      )
      or (
        challenge_id is not null
        and exists (
          select 1 from public.challenge_participants cp
          where cp.challenge_id = creator_announcements.challenge_id
            and cp.user_id = auth.uid()
        )
      )
    )
  );

-- External links (shop, social, coaching, etc.)
create table if not exists public.creator_links (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.creator_communities (id) on delete cascade,
  link_type text not null default 'other',
  label text not null,
  url text not null,
  sort_order int not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists creator_links_community_idx
  on public.creator_links (community_id, sort_order);

alter table public.creator_links enable row level security;

create policy "Creators manage own links"
  on public.creator_links for all
  using (public.creator_owns_community(community_id, auth.uid()))
  with check (public.creator_owns_community(community_id, auth.uid()));

create policy "Public read visible creator links"
  on public.creator_links for select
  using (is_public = true);
