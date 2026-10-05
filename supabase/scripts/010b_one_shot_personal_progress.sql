-- ONE-SHOT: Personal Progress when member_goals does NOT exist yet.
-- Use this if 010 failed with: relation "public.member_goals" does not exist
-- Supabase → SQL Editor → paste ALL → Run.

-- ── Core habit tables (from migration 006, with 010 columns included) ──

create table if not exists public.member_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text not null default 'routine',
  active boolean not null default true,
  sort_order int not null default 0,
  template_key text,
  frequency_type text not null default 'daily'
    check (frequency_type in ('daily', 'times_per_week')),
  frequency_target int not null default 7
    check (frequency_target >= 1 and frequency_target <= 7),
  paused_at timestamptz,
  linked_challenge_id uuid references public.challenges (id) on delete set null,
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
  mood text check (mood is null or mood in ('rough', 'okay', 'good', 'great')),
  reflection text,
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

-- If tables existed from old 006 without new columns, add them:
alter table public.member_goals
  add column if not exists template_key text,
  add column if not exists frequency_type text not null default 'daily',
  add column if not exists frequency_target int not null default 7,
  add column if not exists paused_at timestamptz,
  add column if not exists linked_challenge_id uuid references public.challenges (id) on delete set null;

alter table public.daily_check_ins
  add column if not exists mood text,
  add column if not exists reflection text;

alter table public.profiles
  add column if not exists weight_tracking_enabled boolean not null default true;

-- RLS
alter table public.member_goals enable row level security;
alter table public.goal_completions enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.weekly_weigh_ins enable row level security;

drop policy if exists "Users manage own goals" on public.member_goals;
create policy "Users manage own goals"
  on public.member_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own goal completions" on public.goal_completions;
create policy "Users manage own goal completions"
  on public.goal_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own check-ins" on public.daily_check_ins;
create policy "Users manage own check-ins"
  on public.daily_check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own weigh-ins" on public.weekly_weigh_ins;
create policy "Users manage own weigh-ins"
  on public.weekly_weigh_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Milestones
create table if not exists public.member_milestones (
  user_id uuid not null references public.profiles (id) on delete cascade,
  milestone_key text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, milestone_key)
);

alter table public.member_milestones enable row level security;

drop policy if exists "Users read own milestones" on public.member_milestones;
drop policy if exists "Users insert own milestones" on public.member_milestones;

create policy "Users read own milestones"
  on public.member_milestones for select
  using (auth.uid() = user_id);

create policy "Users insert own milestones"
  on public.member_milestones for insert
  with check (auth.uid() = user_id);

-- Group achievement shares (needs accountability_groups + is_group_member)
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

create table if not exists public.group_achievement_shares (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  share_type text not null
    check (share_type in ('weekly_habits', 'milestone', 'challenge_complete')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists group_achievement_shares_group_idx
  on public.group_achievement_shares (group_id, created_at desc);

alter table public.group_achievement_shares enable row level security;

drop policy if exists "Group members read achievement shares" on public.group_achievement_shares;
drop policy if exists "Members share own achievements to group" on public.group_achievement_shares;

create policy "Group members read achievement shares"
  on public.group_achievement_shares for select
  using (public.is_group_member(group_id, auth.uid()));

create policy "Members share own achievements to group"
  on public.group_achievement_shares for insert
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
  );
