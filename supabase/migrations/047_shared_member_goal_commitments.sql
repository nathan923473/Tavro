-- Share Progress page habits (member_goals) with accountability groups.

create table if not exists public.member_goal_group_shares (
  id uuid primary key default gen_random_uuid(),
  member_goal_id uuid not null references public.member_goals (id) on delete cascade,
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_goal_id, group_id)
);

create index if not exists member_goal_group_shares_group_idx
  on public.member_goal_group_shares (group_id);

create index if not exists member_goal_group_shares_user_idx
  on public.member_goal_group_shares (user_id);

alter table public.member_goal_group_shares enable row level security;

drop policy if exists "Group members read shared habits" on public.member_goal_group_shares;
create policy "Group members read shared habits"
  on public.member_goal_group_shares for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Owners manage habit shares" on public.member_goal_group_shares;
create policy "Owners manage habit shares"
  on public.member_goal_group_shares for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
  );

-- Thumbs-up when a member completes a shared habit (one per viewer per habit per day).
create table if not exists public.group_shared_habit_celebrations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  member_goal_id uuid not null references public.member_goals (id) on delete cascade,
  for_user_id uuid not null references public.profiles (id) on delete cascade,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  celebration_date date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default now(),
  unique (group_id, member_goal_id, from_user_id, celebration_date)
);

create index if not exists group_shared_habit_celebrations_goal_idx
  on public.group_shared_habit_celebrations (group_id, member_goal_id);

alter table public.group_shared_habit_celebrations enable row level security;

drop policy if exists "Members read habit celebrations" on public.group_shared_habit_celebrations;
create policy "Members read habit celebrations"
  on public.group_shared_habit_celebrations for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members send habit celebrations" on public.group_shared_habit_celebrations;
create policy "Members send habit celebrations"
  on public.group_shared_habit_celebrations for insert
  with check (
    auth.uid() = from_user_id
    and from_user_id <> for_user_id
    and public.is_group_member(group_id, auth.uid())
  );

-- Optional weekly reflection (not weight / measurements).
create table if not exists public.group_weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  went_well text not null default '',
  struggled_with text not null default '',
  focus_next text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id, week_start)
);

alter table public.group_weekly_reflections enable row level security;

drop policy if exists "Members read weekly reflections" on public.group_weekly_reflections;
create policy "Members read weekly reflections"
  on public.group_weekly_reflections for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members manage own weekly reflections" on public.group_weekly_reflections;
create policy "Members manage own weekly reflections"
  on public.group_weekly_reflections for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
  );
