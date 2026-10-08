-- Safe to run if 032 failed partway (e.g. before columns or at viewer function).
-- Adds missing 032 schema, then recreates get_accountability_group_for_viewer.

alter table public.accountability_groups
  add column if not exists description text not null default '';

alter table public.accountability_groups
  add column if not exists focus_type text not null default 'general';

alter table public.accountability_groups
  drop constraint if exists accountability_groups_focus_type_check;

alter table public.accountability_groups
  add constraint accountability_groups_focus_type_check
  check (focus_type in (
    'walking', 'gym', 'nutrition', 'weight_loss', 'routines', 'general'
  ));

alter table public.accountability_groups
  add column if not exists shared_goal text not null default '';

update public.accountability_groups
set shared_goal = goal
where shared_goal = ''
  and coalesce(goal, '') <> '';

alter table public.group_messages
  add column if not exists image_path text;

create table if not exists public.group_weekly_commitments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  title text not null,
  target_count int not null default 1 check (target_count >= 1 and target_count <= 99),
  progress_count int not null default 0 check (progress_count >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(title)) >= 2)
);

create index if not exists group_weekly_commitments_group_week_idx
  on public.group_weekly_commitments (group_id, week_start, user_id);

create table if not exists public.group_member_daily_check_ins (
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  check_in_date date not null,
  status text not null check (status in ('completed', 'partial', 'missed', 'rest')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id, check_in_date)
);

create index if not exists group_member_daily_check_ins_group_date_idx
  on public.group_member_daily_check_ins (group_id, check_in_date desc);

create table if not exists public.group_message_reactions (
  message_id uuid not null references public.group_messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null default '👍',
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.group_encouragements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create index if not exists group_encouragements_to_user_idx
  on public.group_encouragements (to_user_id, created_at desc);

create table if not exists public.group_member_participation (
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  paused_until date,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_weekly_recaps (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  week_start date not null,
  summary jsonb not null default '{}'::jsonb,
  reflection_prompt text not null default 'What was your biggest challenge this week, and what will you do differently next week?',
  created_at timestamptz not null default now(),
  unique (group_id, week_start)
);

create or replace function public.get_group_check_in_board(
  p_group_id uuid,
  p_date date default (timezone('utc', now()))::date
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  status text,
  note text,
  checked_in boolean
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    gm.user_id,
    coalesce(p.display_name, 'Member') as display_name,
    p.avatar_url,
    coalesce(c.status, '') as status,
    coalesce(c.note, '') as note,
    c.status is not null as checked_in
  from public.group_members gm
  inner join public.profiles p on p.id = gm.user_id
  left join public.group_member_daily_check_ins c
    on c.group_id = gm.group_id
   and c.user_id = gm.user_id
   and c.check_in_date = p_date
  where gm.group_id = p_group_id
    and public.is_group_member(p_group_id, auth.uid())
  order by p.display_name asc;
$$;

revoke all on function public.get_group_check_in_board(uuid, date) from public;
grant execute on function public.get_group_check_in_board(uuid, date) to authenticated;

alter table public.group_weekly_commitments enable row level security;
alter table public.group_member_daily_check_ins enable row level security;
alter table public.group_message_reactions enable row level security;
alter table public.group_encouragements enable row level security;
alter table public.group_member_participation enable row level security;
alter table public.group_weekly_recaps enable row level security;

drop policy if exists "Members read group commitments" on public.group_weekly_commitments;
create policy "Members read group commitments"
  on public.group_weekly_commitments for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members manage own commitments" on public.group_weekly_commitments;
create policy "Members manage own commitments"
  on public.group_weekly_commitments for all
  using (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()))
  with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members read group daily check-ins" on public.group_member_daily_check_ins;
create policy "Members read group daily check-ins"
  on public.group_member_daily_check_ins for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members upsert own group check-ins" on public.group_member_daily_check_ins;
create policy "Members upsert own group check-ins"
  on public.group_member_daily_check_ins for all
  using (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()))
  with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members read message reactions" on public.group_message_reactions;
create policy "Members read message reactions"
  on public.group_message_reactions for select
  using (
    exists (
      select 1 from public.group_messages m
      where m.id = message_id
        and public.is_group_member(m.group_id, auth.uid())
    )
  );

drop policy if exists "Members react to messages" on public.group_message_reactions;
create policy "Members react to messages"
  on public.group_message_reactions for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_messages m
      where m.id = message_id
        and public.is_group_member(m.group_id, auth.uid())
    )
  );

drop policy if exists "Members read encouragements in group" on public.group_encouragements;
create policy "Members read encouragements in group"
  on public.group_encouragements for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members send encouragement" on public.group_encouragements;
create policy "Members send encouragement"
  on public.group_encouragements for insert
  with check (
    auth.uid() = from_user_id
    and public.is_group_member(group_id, auth.uid())
  );

drop policy if exists "Members read participation settings" on public.group_member_participation;
create policy "Members read participation settings"
  on public.group_member_participation for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members manage own participation" on public.group_member_participation;
create policy "Members manage own participation"
  on public.group_member_participation for all
  using (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()))
  with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

drop policy if exists "Members read weekly recaps" on public.group_weekly_recaps;
create policy "Members read weekly recaps"
  on public.group_weekly_recaps for select
  using (public.is_group_member(group_id, auth.uid()));

drop function if exists public.get_accountability_group_for_viewer(uuid);

create or replace function public.get_accountability_group_for_viewer(p_group_id uuid)
returns table (
  id uuid,
  name text,
  goal text,
  invite_code text,
  max_members int,
  join_mode text,
  invites_enabled boolean,
  created_by uuid,
  description text,
  focus_type text,
  shared_goal text
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    g.id,
    g.name,
    coalesce(g.goal, '') as goal,
    g.invite_code,
    g.max_members,
    coalesce(g.join_mode, 'approval') as join_mode,
    coalesce(g.invites_enabled, true) as invites_enabled,
    g.created_by,
    coalesce(g.description, '') as description,
    coalesce(g.focus_type, 'general') as focus_type,
    coalesce(g.shared_goal, coalesce(g.goal, '')) as shared_goal
  from public.accountability_groups g
  where g.id = p_group_id
    and (
      g.created_by = auth.uid()
      or public.is_group_member(g.id, auth.uid())
    )
  limit 1;
$$;

revoke all on function public.get_accountability_group_for_viewer(uuid) from public;
grant execute on function public.get_accountability_group_for_viewer(uuid) to authenticated;
