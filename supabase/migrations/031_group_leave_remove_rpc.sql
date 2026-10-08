-- Leave / remove member with security definer (RLS-safe) + row checks.

create or replace function public.remove_group_member_by_owner(
  p_group_id uuid,
  p_member_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_deleted int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select g.created_by into v_owner
  from public.accountability_groups g
  where g.id = p_group_id;

  if v_owner is null or v_owner <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if p_member_user_id = v_uid then
    return jsonb_build_object('ok', false, 'error', 'cannot_remove_self');
  end if;

  delete from public.group_members
  where group_id = p_group_id
    and user_id = p_member_user_id;

  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.remove_group_member_by_owner(uuid, uuid) from public;
grant execute on function public.remove_group_member_by_owner(uuid, uuid) to authenticated;

create or replace function public.leave_accountability_group(p_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_count int;
  v_deleted int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  if p_group_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_group');
  end if;

  if not public.is_group_member(p_group_id, v_uid)
     and not exists (
       select 1 from public.accountability_groups g
       where g.id = p_group_id and g.created_by = v_uid
     ) then
    return jsonb_build_object('ok', false, 'error', 'not_member');
  end if;

  select g.created_by into v_owner
  from public.accountability_groups g
  where g.id = p_group_id;

  if v_owner = v_uid then
    v_count := public.group_member_count(p_group_id);
    if v_count > 1 then
      return jsonb_build_object('ok', false, 'error', 'owner_must_transfer');
    end if;

    delete from public.accountability_groups
    where id = p_group_id
      and created_by = v_uid;

    get diagnostics v_deleted = row_count;
    if v_deleted = 0 then
      return jsonb_build_object('ok', false, 'error', 'delete_failed');
    end if;

    return jsonb_build_object('ok', true, 'status', 'group_deleted');
  end if;

  delete from public.group_members
  where group_id = p_group_id
    and user_id = v_uid;

  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    return jsonb_build_object('ok', false, 'error', 'leave_failed');
  end if;

  return jsonb_build_object('ok', true, 'status', 'left');
end;
$$;

revoke all on function public.leave_accountability_group(uuid) from public;
grant execute on function public.leave_accountability_group(uuid) to authenticated;
