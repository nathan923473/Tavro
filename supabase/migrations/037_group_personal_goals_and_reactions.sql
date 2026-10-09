-- Personal goals per member (schedule-aware) + check-in encouragement reactions.

create table if not exists public.group_member_personal_goals (
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  schedule_type text not null default 'daily'
    check (schedule_type in ('daily', 'every_n_days', 'weekdays', 'times_per_week')),
  schedule_interval int not null default 1 check (schedule_interval >= 1 and schedule_interval <= 14),
  schedule_weekdays int[] not null default '{}',
  times_per_week int not null default 3 check (times_per_week >= 1 and times_per_week <= 7),
  schedule_anchor date not null default (timezone('utc', now()))::date,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id),
  check (char_length(trim(title)) >= 2)
);

alter table public.group_member_personal_goals enable row level security;

drop policy if exists "Members read personal goals in group" on public.group_member_personal_goals;
create policy "Members read personal goals in group"
  on public.group_member_personal_goals for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members manage own personal goal" on public.group_member_personal_goals;
create policy "Members manage own personal goal"
  on public.group_member_personal_goals for all
  using (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()))
  with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

create table if not exists public.group_check_in_reactions (
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  check_in_date date not null,
  reactor_user_id uuid not null references public.profiles (id) on delete cascade,
  reaction_key text not null check (reaction_key in ('clap', 'fire', 'muscle', 'heart')),
  created_at timestamptz not null default now(),
  primary key (group_id, target_user_id, check_in_date, reactor_user_id, reaction_key)
);

create index if not exists group_check_in_reactions_target_idx
  on public.group_check_in_reactions (group_id, target_user_id, check_in_date);

alter table public.group_check_in_reactions enable row level security;

drop policy if exists "Members read check-in reactions" on public.group_check_in_reactions;
create policy "Members read check-in reactions"
  on public.group_check_in_reactions for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members react to check-ins" on public.group_check_in_reactions;
create policy "Members react to check-ins"
  on public.group_check_in_reactions for all
  using (auth.uid() = reactor_user_id and public.is_group_member(group_id, auth.uid()))
  with check (auth.uid() = reactor_user_id and public.is_group_member(group_id, auth.uid()));
