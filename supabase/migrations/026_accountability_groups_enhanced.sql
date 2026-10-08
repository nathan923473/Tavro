-- P.A. Groups: goal, join mode, invite controls, join requests, secure join RPC.

alter table public.accountability_groups
  add column if not exists goal text not null default '';

alter table public.accountability_groups
  add column if not exists join_mode text not null default 'approval';

alter table public.accountability_groups
  drop constraint if exists accountability_groups_join_mode_check;

alter table public.accountability_groups
  add constraint accountability_groups_join_mode_check
  check (join_mode in ('approval', 'auto'));

alter table public.accountability_groups
  add column if not exists invites_enabled boolean not null default true;

alter table public.accountability_groups
  alter column max_members set default 6;

update public.accountability_groups
set max_members = least(max_members, 6)
where max_members > 6;

create table if not exists public.group_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists group_join_requests_group_pending_idx
  on public.group_join_requests (group_id)
  where status = 'pending';

alter table public.group_join_requests enable row level security;

-- Replace invite lookup (public teaser only — no messages)
drop function if exists public.get_group_by_invite_code(text) cascade;

create function public.get_group_by_invite_code(p_code text)
returns table (
  id uuid,
  name text,
  goal text,
  invite_code text,
  max_members int,
  join_mode text,
  invites_enabled boolean
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
    g.goal,
    g.invite_code,
    g.max_members,
    g.join_mode,
    g.invites_enabled
  from public.accountability_groups g
  where g.invite_code = trim(p_code)
    and g.invites_enabled = true
  limit 1;
$$;

revoke all on function public.get_group_by_invite_code(text) from public;
grant execute on function public.get_group_by_invite_code(text) to authenticated;
grant execute on function public.get_group_by_invite_code(text) to anon;

create or replace function public.group_member_count(p_group_id uuid)
returns int
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select count(*)::int from public.group_members gm where gm.group_id = p_group_id;
$$;

revoke all on function public.group_member_count(uuid) from public;
grant execute on function public.group_member_count(uuid) to authenticated;

create or replace function public.attempt_group_join(p_code text)
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
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_group
  from public.accountability_groups g
  where g.invite_code = trim(p_code)
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_invite');
  end if;

  if not v_group.invites_enabled then
    return jsonb_build_object('ok', false, 'error', 'invites_disabled');
  end if;

  if exists (
    select 1 from public.group_members
    where group_id = v_group.id and user_id = v_uid
  ) then
    return jsonb_build_object('ok', true, 'status', 'already_member', 'group_id', v_group.id);
  end if;

  v_count := public.group_member_count(v_group.id);
  if v_count >= v_group.max_members then
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  if v_group.join_mode = 'auto' then
    insert into public.group_members (group_id, user_id)
    values (v_group.id, v_uid)
    on conflict do nothing;
    return jsonb_build_object('ok', true, 'status', 'joined', 'group_id', v_group.id);
  end if;

  insert into public.group_join_requests (group_id, user_id, status)
  values (v_group.id, v_uid, 'pending')
  on conflict (group_id, user_id) do update
    set status = excluded.status, created_at = now()
  where public.group_join_requests.status <> 'approved';

  return jsonb_build_object('ok', true, 'status', 'pending', 'group_id', v_group.id);
end;
$$;

revoke all on function public.attempt_group_join(text) from public;
grant execute on function public.attempt_group_join(text) to authenticated;

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
begin
  select * into v_req from public.group_join_requests where id = p_request_id;
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

  v_count := public.group_member_count(v_req.group_id);
  if v_count >= (
    select max_members from public.accountability_groups where id = v_req.group_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_req.group_id, v_req.user_id)
  on conflict do nothing;

  update public.group_join_requests
  set status = 'approved'
  where id = p_request_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.approve_group_join_request(uuid) from public;
grant execute on function public.approve_group_join_request(uuid) to authenticated;

create or replace function public.decline_group_join_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_req public.group_join_requests%rowtype;
begin
  select * into v_req from public.group_join_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if not exists (
    select 1 from public.accountability_groups g
    where g.id = v_req.group_id and g.created_by = v_uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  update public.group_join_requests set status = 'declined' where id = p_request_id;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.decline_group_join_request(uuid) from public;
grant execute on function public.decline_group_join_request(uuid) to authenticated;

-- RLS: join requests visible to owner + applicant
drop policy if exists "Join requests readable by owner" on public.group_join_requests;
drop policy if exists "Join requests readable by applicant" on public.group_join_requests;

create policy "Join requests readable by owner"
  on public.group_join_requests for select
  using (
    exists (
      select 1 from public.accountability_groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

create policy "Join requests readable by applicant"
  on public.group_join_requests for select
  using (user_id = auth.uid());

-- Owner may update group settings
drop policy if exists "Group owner updates settings" on public.accountability_groups;

create policy "Group owner updates settings"
  on public.accountability_groups for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Owner may remove members (not self without transfer — enforced in app)
drop policy if exists "Group owner removes members" on public.group_members;

create policy "Group owner removes members"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.accountability_groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

-- Owner may delete empty-ish group or app uses RPC; allow owner delete group row
drop policy if exists "Group owner deletes group" on public.accountability_groups;

create policy "Group owner deletes group"
  on public.accountability_groups for delete
  using (created_by = auth.uid());

create or replace function public.enforce_group_member_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_max int;
  v_count int;
begin
  select max_members into v_max
  from public.accountability_groups
  where id = new.group_id;

  v_count := public.group_member_count(new.group_id);
  if v_count >= v_max then
    raise exception 'group_full';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_group_member_capacity_trigger on public.group_members;

create trigger enforce_group_member_capacity_trigger
  before insert on public.group_members
  for each row
  execute function public.enforce_group_member_capacity();
