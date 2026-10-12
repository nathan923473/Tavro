-- Opt-in sharing of Progress habits with an accountability group.
-- No row in member_goal_group_shares means the habit stays private.
-- Weight, mood, and private check-in notes are not part of this share.

create table if not exists public.member_goal_group_shares (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.member_goals (id) on delete cascade,
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (goal_id)
);

create index if not exists member_goal_group_shares_group_idx
  on public.member_goal_group_shares (group_id, user_id);

create table if not exists public.member_goal_celebrations (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.member_goal_group_shares (id) on delete cascade,
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  goal_id uuid not null references public.member_goals (id) on delete cascade,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  unique (share_id, from_user_id, week_start),
  check (from_user_id <> to_user_id)
);

create index if not exists member_goal_celebrations_group_week_idx
  on public.member_goal_celebrations (group_id, week_start);

create table if not exists public.member_goal_weekly_reflections (
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id, week_start),
  check (char_length(btrim(body)) >= 1 and char_length(body) <= 500)
);

create index if not exists member_goal_weekly_reflections_group_week_idx
  on public.member_goal_weekly_reflections (group_id, week_start);

alter table public.member_goal_group_shares enable row level security;
alter table public.member_goal_celebrations enable row level security;
alter table public.member_goal_weekly_reflections enable row level security;

drop policy if exists "Members read habit shares" on public.member_goal_group_shares;
create policy "Members read habit shares"
  on public.member_goal_group_shares for select
  using (
    auth.uid() = user_id
    or public.is_group_member(group_id, auth.uid())
  );

drop policy if exists "Members share own habits with their group" on public.member_goal_group_shares;
create policy "Members share own habits with their group"
  on public.member_goal_group_shares for insert
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
    and exists (
      select 1
      from public.member_goals g
      where g.id = goal_id
        and g.user_id = auth.uid()
        and g.active = true
    )
  );

drop policy if exists "Members update own habit shares" on public.member_goal_group_shares;
create policy "Members update own habit shares"
  on public.member_goal_group_shares for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
    and exists (
      select 1
      from public.member_goals g
      where g.id = goal_id
        and g.user_id = auth.uid()
    )
  );

drop policy if exists "Members unshare own habits" on public.member_goal_group_shares;
create policy "Members unshare own habits"
  on public.member_goal_group_shares for delete
  using (auth.uid() = user_id);

drop policy if exists "Group members read shared habits" on public.member_goals;
create policy "Group members read shared habits"
  on public.member_goals for select
  using (
    member_goals.active = true
    and exists (
      select 1
      from public.member_goal_group_shares s
      where s.goal_id = member_goals.id
        and public.is_group_member(s.group_id, auth.uid())
        and public.is_group_member(s.group_id, s.user_id)
    )
  );

drop policy if exists "Group members read shared habit completions" on public.goal_completions;
create policy "Group members read shared habit completions"
  on public.goal_completions for select
  using (
    exists (
      select 1
      from public.member_goal_group_shares s
      where s.goal_id = goal_completions.goal_id
        and s.user_id = goal_completions.user_id
        and public.is_group_member(s.group_id, auth.uid())
        and public.is_group_member(s.group_id, s.user_id)
    )
  );

drop policy if exists "Members read habit celebrations" on public.member_goal_celebrations;
create policy "Members read habit celebrations"
  on public.member_goal_celebrations for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members celebrate shared habits" on public.member_goal_celebrations;
create policy "Members celebrate shared habits"
  on public.member_goal_celebrations for insert
  with check (
    auth.uid() = from_user_id
    and from_user_id <> to_user_id
    and public.is_group_member(group_id, auth.uid())
    and exists (
      select 1
      from public.member_goal_group_shares s
      where s.id = share_id
        and s.group_id = member_goal_celebrations.group_id
        and s.goal_id = member_goal_celebrations.goal_id
        and s.user_id = member_goal_celebrations.to_user_id
        and public.is_group_member(s.group_id, s.user_id)
    )
  );

drop policy if exists "Members read weekly reflections" on public.member_goal_weekly_reflections;
create policy "Members read weekly reflections"
  on public.member_goal_weekly_reflections for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members write own weekly reflections" on public.member_goal_weekly_reflections;
create policy "Members write own weekly reflections"
  on public.member_goal_weekly_reflections for all
  using (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
  );

comment on table public.member_goal_group_shares is
  'Opt-in link from a Progress habit to one accountability group. Absence means private.';
