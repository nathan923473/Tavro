-- Member activity, groups, and messaging (run after 005a + 005b)

alter table public.challenges
  add column if not exists focus_areas text[] not null default '{}';

alter table public.challenge_participants
  add column if not exists progress_percent int not null default 0
    check (progress_percent >= 0 and progress_percent <= 100),
  add column if not exists last_activity_date date;

alter table public.creator_communities
  add column if not exists social_links jsonb not null default '[]'::jsonb;

-- Personal goals
create table if not exists public.member_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text not null default 'routine',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists member_goals_user_idx on public.member_goals (user_id);

create table if not exists public.goal_completions (
  goal_id uuid not null references public.member_goals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  completion_date date not null,
  primary key (goal_id, completion_date)
);

create table if not exists public.daily_check_ins (
  user_id uuid not null references public.profiles (id) on delete cascade,
  check_in_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, check_in_date)
);

create table if not exists public.weekly_weigh_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  recorded_date date not null,
  weight_lb numeric(6, 2) not null,
  created_at timestamptz not null default now(),
  unique (user_id, recorded_date)
);

-- Accountability groups
create table if not exists public.accountability_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  max_members int not null default 8,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Drop stale partial tables (old schema without author_id) before recreate
drop policy if exists "Group messages readable by members" on public.group_messages;
drop policy if exists "Group members post messages" on public.group_messages;
drop policy if exists "Challenge messages readable by participants" on public.challenge_messages;
drop policy if exists "Challenge messages post by participants" on public.challenge_messages;
drop table if exists public.challenge_messages cascade;
drop table if exists public.group_messages cascade;

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index group_messages_group_idx
  on public.group_messages (group_id, created_at desc);

create table public.challenge_messages (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_role text not null check (author_role in ('creator', 'member')),
  body text not null,
  created_at timestamptz not null default now()
);

create index challenge_messages_challenge_idx
  on public.challenge_messages (challenge_id, created_at asc);

-- RLS
alter table public.member_goals enable row level security;
alter table public.goal_completions enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.weekly_weigh_ins enable row level security;
alter table public.accountability_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.challenge_messages enable row level security;

create policy "Users manage own goals"
  on public.member_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own goal completions"
  on public.goal_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own check-ins"
  on public.daily_check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own weigh-ins"
  on public.weekly_weigh_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helper defined in 007_fix_group_rls_recursion.sql (or run 007 after 006)
create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = p_user_id
  );
$$;

revoke all on function public.is_group_member(uuid, uuid) from public;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;

create policy "Groups readable by members"
  on public.accountability_groups for select
  using (
    created_by = auth.uid()
    or public.is_group_member(id, auth.uid())
  );

create policy "Authenticated create groups"
  on public.accountability_groups for insert
  with check (auth.uid() = created_by);

create policy "Group members readable by co-members"
  on public.group_members for select
  using (
    user_id = auth.uid()
    or public.is_group_member(group_id, auth.uid())
  );

create policy "Users join groups"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create policy "Users leave own membership"
  on public.group_members for delete
  using (auth.uid() = user_id);

create policy "Group messages readable by members"
  on public.group_messages for select
  using (public.is_group_member(group_id, auth.uid()));

create policy "Group members post messages"
  on public.group_messages for insert
  with check (
    auth.uid() = author_id
    and public.is_group_member(group_id, auth.uid())
  );

create policy "Challenge messages readable by participants"
  on public.challenge_messages for select
  using (
    exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenge_id and cp.user_id = auth.uid()
    )
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.created_by = auth.uid()
    )
  );

create policy "Challenge messages post by participants"
  on public.challenge_messages for insert
  with check (
    auth.uid() = author_id
    and (
      exists (
        select 1 from public.challenge_participants cp
        where cp.challenge_id = challenge_id and cp.user_id = auth.uid()
      )
      or exists (
        select 1 from public.challenges c
        where c.id = challenge_id and c.created_by = auth.uid()
      )
    )
  );

-- Co-members can read display names (for group UI)
create or replace function public.shares_group_with(p_other_user_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = p_user_id and b.user_id = p_other_user_id
  );
$$;

revoke all on function public.shares_group_with(uuid, uuid) from public;
grant execute on function public.shares_group_with(uuid, uuid) to authenticated;

create policy "Group co-members read profile names"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.shares_group_with(id, auth.uid())
  );

-- Participants can leave challenges
create policy "Users leave challenges"
  on public.challenge_participants for delete
  using (auth.uid() = user_id);

create policy "Participants update own progress"
  on public.challenge_participants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
