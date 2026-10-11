-- Optional discoverable accountability groups (Phase 1). Private groups unchanged by default.

alter table public.profiles
  add column if not exists adult_verified_at timestamptz;

comment on column public.profiles.adult_verified_at is
  'Set only through a future age-assurance or admin process. Required for group discovery.';

alter table public.accountability_groups
  add column if not exists visibility text not null default 'private';

alter table public.accountability_groups
  drop constraint if exists accountability_groups_visibility_check;

alter table public.accountability_groups
  add constraint accountability_groups_visibility_check
  check (visibility in ('private', 'discoverable'));

alter table public.accountability_groups
  add column if not exists discovery_paused boolean not null default false;

alter table public.accountability_groups
  add column if not exists check_in_frequency text not null default 'flexible';

alter table public.accountability_groups
  drop constraint if exists accountability_groups_check_in_frequency_check;

alter table public.accountability_groups
  add column if not exists discovery_summary text not null default '';

alter table public.accountability_groups
  add constraint accountability_groups_check_in_frequency_check
  check (check_in_frequency in ('daily', 'weekdays', 'weekly', 'flexible'));

update public.accountability_groups
set discovery_summary = left(coalesce(description, goal, ''), 280)
where discovery_summary = '';

-- User blocks (stranger safety)
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

create policy "Users manage own blocks"
  on public.user_blocks for all
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

alter table public.group_join_requests
  add column if not exists request_source text not null default 'invite';

alter table public.group_join_requests
  drop constraint if exists group_join_requests_request_source_check;

alter table public.group_join_requests
  add constraint group_join_requests_request_source_check
  check (request_source in ('invite', 'discovery'));

create or replace function public.is_group_discovery_eligible(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.adult_verified_at is not null
  );
$$;

revoke all on function public.is_group_discovery_eligible(uuid) from public;
grant execute on function public.is_group_discovery_eligible(uuid) to authenticated;

create or replace function public.users_are_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;

revoke all on function public.users_are_blocked(uuid, uuid) from public;
grant execute on function public.users_are_blocked(uuid, uuid) to authenticated;

create or replace function public.list_discoverable_groups(
  p_focus text default null,
  p_check_in_frequency text default null,
  p_limit int default 24
)
returns table (
  id uuid,
  name text,
  focus_type text,
  focus_custom_label text,
  member_count int,
  max_members int,
  check_in_frequency text,
  discovery_summary text
)
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  if not public.is_group_discovery_eligible(v_uid) then
    return;
  end if;

  return query
  select
    g.id,
    g.name,
    g.focus_type,
    coalesce(g.focus_custom_label, '') as focus_custom_label,
    public.group_member_count(g.id) as member_count,
    g.max_members,
    g.check_in_frequency,
    left(
      coalesce(
        nullif(trim(g.discovery_summary), ''),
        nullif(trim(g.description), ''),
        nullif(trim(g.goal), ''),
        'Small accountability group'
      ),
      280
    ) as discovery_summary
  from public.accountability_groups g
  where g.visibility = 'discoverable'
    and g.discovery_paused = false
    and g.invites_enabled = true
    and public.group_member_count(g.id) < g.max_members
    and not exists (
      select 1 from public.group_members gm
      where gm.group_id = g.id and gm.user_id = v_uid
    )
    and not exists (
      select 1 from public.group_join_requests r
      where r.group_id = g.id and r.user_id = v_uid and r.status = 'pending'
    )
    and not public.users_are_blocked(v_uid, g.created_by)
    and (p_focus is null or p_focus = '' or g.focus_type = p_focus)
    and (
      p_check_in_frequency is null
      or p_check_in_frequency = ''
      or g.check_in_frequency = p_check_in_frequency
    )
  order by
    case when p_focus is not null and g.focus_type = p_focus then 0 else 1 end,
    public.group_member_count(g.id) asc,
    g.created_at desc
  limit greatest(1, least(coalesce(p_limit, 24), 50));
end;
$$;

revoke all on function public.list_discoverable_groups(text, text, int) from public;
grant execute on function public.list_discoverable_groups(text, text, int) to authenticated;

create or replace function public.request_discovery_group_join(p_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_group public.accountability_groups%rowtype;
  v_count int;
  v_recent int;
  v_last_declined timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if not public.is_group_discovery_eligible(v_uid) then
    return jsonb_build_object('ok', false, 'error', 'discovery_not_available');
  end if;

  if exists (select 1 from public.group_members gm where gm.user_id = v_uid) then
    return jsonb_build_object('ok', false, 'error', 'already_in_group');
  end if;

  select * into v_group from public.accountability_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_group.visibility <> 'discoverable' or v_group.discovery_paused or not v_group.invites_enabled then
    return jsonb_build_object('ok', false, 'error', 'not_discoverable');
  end if;

  if public.users_are_blocked(v_uid, v_group.created_by) then
    return jsonb_build_object('ok', false, 'error', 'blocked');
  end if;

  v_count := public.group_member_count(v_group.id);
  if v_count >= v_group.max_members then
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  select count(*) into v_recent
  from public.group_join_requests
  where user_id = v_uid
    and request_source = 'discovery'
    and created_at > now() - interval '24 hours';

  if v_recent >= 8 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  select max(r.created_at) into v_last_declined
  from public.group_join_requests r
  where r.group_id = p_group_id
    and r.user_id = v_uid
    and r.status = 'declined';

  if v_last_declined is not null and v_last_declined > now() - interval '7 days' then
    return jsonb_build_object('ok', false, 'error', 'recently_declined');
  end if;

  insert into public.group_join_requests (group_id, user_id, status, request_source)
  values (p_group_id, v_uid, 'pending', 'discovery')
  on conflict (group_id, user_id) do update
    set status = 'pending',
        request_source = 'discovery',
        created_at = now()
  where public.group_join_requests.status <> 'approved';

  return jsonb_build_object(
    'ok', true,
    'status', 'pending',
    'group_id', p_group_id,
    'owner_id', v_group.created_by
  );
end;
$$;

revoke all on function public.request_discovery_group_join(uuid) from public;
grant execute on function public.request_discovery_group_join(uuid) to authenticated;

-- Safer approve: lock group row when approving
create or replace function public.approve_group_join_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_req public.group_join_requests%rowtype;
  v_count int;
  v_max int;
begin
  select * into v_req from public.group_join_requests where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if not exists (
    select 1 from public.accountability_groups g
    where g.id = v_req.group_id and g.created_by = v_uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if v_req.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'not_pending');
  end if;

  select max_members into v_max
  from public.accountability_groups
  where id = v_req.group_id
  for update;

  v_count := public.group_member_count(v_req.group_id);
  if v_count >= v_max then
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_req.group_id, v_req.user_id)
  on conflict do nothing;

  update public.group_join_requests
  set status = 'approved'
  where id = p_request_id;

  return jsonb_build_object('ok', true, 'applicant_id', v_req.user_id);
end;
$$;

-- Include request source for owner UI (discovery vs invite).
-- Return type changed from 036 — must drop before replace (PostgreSQL 42P13).
drop function if exists public.list_group_pending_join_requests(uuid);

create function public.list_group_pending_join_requests(p_group_id uuid)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  request_source text
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    r.id,
    r.user_id,
    coalesce(p.display_name, 'Member') as display_name,
    p.avatar_url,
    r.created_at,
    coalesce(r.request_source, 'invite') as request_source
  from public.group_join_requests r
  inner join public.profiles p on p.id = r.user_id
  where r.group_id = p_group_id
    and r.status = 'pending'
    and exists (
      select 1
      from public.accountability_groups g
      where g.id = p_group_id
        and g.created_by = auth.uid()
    )
  order by r.created_at asc;
$$;

revoke all on function public.list_group_pending_join_requests(uuid) from public;
grant execute on function public.list_group_pending_join_requests(uuid) to authenticated;
