-- Personal Progress & Healthy Habits (evolve member_goals, additive).
-- Run once in Supabase SQL Editor after 006.

alter table public.member_goals
  add column if not exists template_key text,
  add column if not exists frequency_type text not null default 'daily'
    check (frequency_type in ('daily', 'times_per_week')),
  add column if not exists frequency_target int not null default 7
    check (frequency_target >= 1 and frequency_target <= 7),
  add column if not exists paused_at timestamptz,
  add column if not exists linked_challenge_id uuid
    references public.challenges (id) on delete set null;

create index if not exists member_goals_linked_challenge_idx
  on public.member_goals (linked_challenge_id)
  where linked_challenge_id is not null;

alter table public.daily_check_ins
  add column if not exists mood text
    check (mood is null or mood in ('rough', 'okay', 'good', 'great')),
  add column if not exists reflection text;

alter table public.profiles
  add column if not exists weight_tracking_enabled boolean not null default true;

create table if not exists public.member_milestones (
  user_id uuid not null references public.profiles (id) on delete cascade,
  milestone_key text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, milestone_key)
);

alter table public.member_milestones enable row level security;

create policy "Users read own milestones"
  on public.member_milestones for select
  using (auth.uid() = user_id);

create policy "Users insert own milestones"
  on public.member_milestones for insert
  with check (auth.uid() = user_id);

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

create policy "Group members read achievement shares"
  on public.group_achievement_shares for select
  using (public.is_group_member(group_id, auth.uid()));

create policy "Members share own achievements to group"
  on public.group_achievement_shares for insert
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
  );
