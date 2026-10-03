-- Streakly: members + approved creators (run after 001_initial_schema.sql)
-- Enforces permissions with RLS — do not rely on frontend alone.

create type public.creator_status as enum ('none', 'pending', 'approved', 'rejected');
create type public.challenge_visibility as enum ('public', 'private');
create type public.application_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles
  add column if not exists creator_status public.creator_status not null default 'none',
  add column if not exists is_admin boolean not null default false;

-- Sync legacy is_creator flag with creator_status
update public.profiles
set creator_status = 'approved', is_creator = true
where is_creator = true and creator_status = 'none';

create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  pitch text not null,
  social_link text,
  status public.application_status not null default 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create unique index if not exists creator_applications_one_pending
  on public.creator_applications (user_id)
  where status = 'pending';

create table if not exists public.creator_communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  slug text not null unique,
  community_name text not null,
  bio text,
  brand_color text default '#3d8b6e',
  banner_url text,
  avatar_url text,
  shop_url text,
  shop_label text,
  affiliate_disclosure text,
  announcement text,
  member_count_cache int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_follows (
  user_id uuid not null references public.profiles (id) on delete cascade,
  community_id uuid not null references public.creator_communities (id) on delete cascade,
  notify_new_challenges boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, community_id)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  community_id uuid references public.creator_communities (id) on delete set null,
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  visibility public.challenge_visibility not null default 'private',
  invite_slug text not null unique,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_challenges_need_approved_creator
    check (
      visibility = 'private'
      or community_id is not null
    )
);

create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table if not exists public.challenge_invites (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  token text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Helpers (security definer for policy use)
create or replace function public.is_approved_creator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.creator_status = 'approved'
  );
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.is_admin = true
  );
$$;

revoke all on function public.is_approved_creator(uuid) from public;
grant execute on function public.is_approved_creator(uuid) to authenticated;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- RLS
alter table public.creator_applications enable row level security;
alter table public.creator_communities enable row level security;
alter table public.community_follows enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_invites enable row level security;

-- Profiles: owners read/update self; public read minimal for display via communities
drop policy if exists "Profiles are viewable by owner" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Profiles viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Applications
create policy "Users read own applications"
  on public.creator_applications for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "Users insert own application"
  on public.creator_applications for insert
  with check (auth.uid() = user_id);

create policy "Admins update applications"
  on public.creator_applications for update
  using (public.is_admin(auth.uid()));

-- Communities: public read; owner write if approved creator
create policy "Communities are public read"
  on public.creator_communities for select
  using (true);

create policy "Approved creators manage own community"
  on public.creator_communities for insert
  with check (
    auth.uid() = owner_id and public.is_approved_creator(auth.uid())
  );

create policy "Approved creators update own community"
  on public.creator_communities for update
  using (
    auth.uid() = owner_id and public.is_approved_creator(auth.uid())
  );

-- Follows
create policy "Users manage own follows"
  on public.community_follows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Challenges
create policy "Public challenges readable by all"
  on public.challenges for select
  using (
    visibility = 'public'
    or created_by = auth.uid()
    or exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = id and cp.user_id = auth.uid()
    )
  );

create policy "Members create private challenges"
  on public.challenges for insert
  with check (
    auth.uid() = created_by
    and (
      visibility = 'private'
      or (
        visibility = 'public'
        and public.is_approved_creator(auth.uid())
      )
    )
  );

create policy "Creators update own challenges"
  on public.challenges for update
  using (
    auth.uid() = created_by
    and (
      visibility = 'private'
      or public.is_approved_creator(auth.uid())
    )
  );

-- Participants
create policy "Participants read own memberships"
  on public.challenge_participants for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.created_by = auth.uid()
    )
  );

create policy "Users join challenges"
  on public.challenge_participants for insert
  with check (auth.uid() = user_id);

-- Invites (private challenges)
create policy "Challenge owners manage invites"
  on public.challenge_invites for all
  using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.created_by = auth.uid()
    )
  );

create policy "Authenticated read invite by token lookup"
  on public.challenge_invites for select
  using (auth.uid() is not null);

-- Approve creator: admin updates application + profile (via admin UI or SQL)
create or replace function public.approve_creator_application(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.creator_applications%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  select * into app from public.creator_applications where id = app_id;
  if app.status <> 'pending' then
    raise exception 'application not pending';
  end if;

  update public.creator_applications
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = app_id;

  update public.profiles
  set creator_status = 'approved', is_creator = true, updated_at = now()
  where id = app.user_id;
end;
$$;

grant execute on function public.approve_creator_application(uuid) to authenticated;
