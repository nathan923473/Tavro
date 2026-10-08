-- Reliable pending join requests for group owners (bypasses RLS / profile embed issues).

create or replace function public.is_accountability_group_owner(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.accountability_groups g
    where g.id = p_group_id
      and g.created_by = auth.uid()
  );
$$;

revoke all on function public.is_accountability_group_owner(uuid) from public;
grant execute on function public.is_accountability_group_owner(uuid) to authenticated;

create or replace function public.list_group_pending_join_requests(p_group_id uuid)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  created_at timestamptz
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
    r.created_at
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
