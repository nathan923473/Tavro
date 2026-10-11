-- Fix 42P13 if 042 failed at list_group_pending_join_requests (return type change).
-- Safe to run even if 042 completed successfully.

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
