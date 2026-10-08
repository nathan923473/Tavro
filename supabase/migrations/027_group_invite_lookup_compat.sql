-- Case-insensitive invite code lookup (legacy lowercase hex + new uppercase codes).

create or replace function public.get_group_by_invite_code(p_code text)
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
  where upper(g.invite_code) = upper(trim(p_code))
    and g.invites_enabled = true
  limit 1;
$$;

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
  v_recent_failures int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select count(*) into v_recent_failures
  from public.group_invite_join_attempts a
  where a.user_id = v_uid
    and a.success = false
    and a.attempted_at > now() - interval '15 minutes';

  if v_recent_failures >= 12 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  select * into v_group
  from public.accountability_groups g
  where upper(g.invite_code) = upper(trim(p_code))
  limit 1;

  if not found then
    insert into public.group_invite_join_attempts (user_id, success)
    values (v_uid, false);
    return jsonb_build_object('ok', false, 'error', 'invalid_invite');
  end if;

  if not v_group.invites_enabled then
    insert into public.group_invite_join_attempts (user_id, success, group_id)
    values (v_uid, false, v_group.id);
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
    insert into public.group_invite_join_attempts (user_id, success, group_id)
    values (v_uid, true, v_group.id);
    return jsonb_build_object('ok', true, 'status', 'joined', 'group_id', v_group.id);
  end if;

  insert into public.group_join_requests (group_id, user_id, status)
  values (v_group.id, v_uid, 'pending')
  on conflict (group_id, user_id) do update
    set status = excluded.status, created_at = now()
  where public.group_join_requests.status <> 'approved';

  insert into public.group_invite_join_attempts (user_id, success, group_id)
  values (v_uid, true, v_group.id);

  return jsonb_build_object('ok', true, 'status', 'pending', 'group_id', v_group.id);
end;
$$;

create table if not exists public.group_invite_join_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid references public.accountability_groups (id) on delete set null,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists group_invite_join_attempts_user_recent_idx
  on public.group_invite_join_attempts (user_id, attempted_at desc);

alter table public.group_invite_join_attempts enable row level security;

create policy "Users read own invite join attempts"
  on public.group_invite_join_attempts for select
  using (user_id = auth.uid());
