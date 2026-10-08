-- Keep group owners in group_members when approving join requests; backfill missing owner rows.

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
  v_owner uuid;
begin
  select * into v_req from public.group_join_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select g.created_by into v_owner
  from public.accountability_groups g
  where g.id = v_req.group_id;

  if v_owner is null or v_owner <> v_uid then
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
  values (v_req.group_id, v_uid)
  on conflict do nothing;

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

insert into public.group_members (group_id, user_id)
select g.id, g.created_by
from public.accountability_groups g
where g.created_by is not null
  and not exists (
    select 1
    from public.group_members gm
    where gm.group_id = g.id
      and gm.user_id = g.created_by
  )
on conflict do nothing;
