-- Allow applicants to cancel pending join requests and load a safe group preview while waiting.

create or replace function public.cancel_group_join_request(p_request_id uuid)
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
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select * into v_req from public.group_join_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_req.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if v_req.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'not_pending');
  end if;

  update public.group_join_requests
  set status = 'declined'
  where id = p_request_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.cancel_group_join_request(uuid) from public;
grant execute on function public.cancel_group_join_request(uuid) to authenticated;

create or replace function public.get_my_pending_group_join()
returns table (
  request_id uuid,
  group_id uuid,
  group_name text,
  group_goal text,
  member_count int,
  max_members int,
  join_mode text
)
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select
    r.id as request_id,
    g.id as group_id,
    g.name as group_name,
    coalesce(g.goal, '') as group_goal,
    public.group_member_count(g.id)::int as member_count,
    g.max_members::int as max_members,
    g.join_mode
  from public.group_join_requests r
  inner join public.accountability_groups g on g.id = r.group_id
  where r.user_id = auth.uid()
    and r.status = 'pending'
  order by r.created_at asc
  limit 1;
$$;

revoke all on function public.get_my_pending_group_join() from public;
grant execute on function public.get_my_pending_group_join() to authenticated;

-- Fallback for clients still using embedded select (name + goal when RLS allows).
drop policy if exists "Groups readable by pending applicant" on public.accountability_groups;

create policy "Groups readable by pending applicant"
  on public.accountability_groups for select
  using (
    exists (
      select 1
      from public.group_join_requests r
      where r.group_id = id
        and r.user_id = auth.uid()
        and r.status = 'pending'
    )
  );
