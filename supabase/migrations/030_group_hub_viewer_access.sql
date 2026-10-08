-- Reliable group hub resolution when RLS blocks direct selects (stuck create vs empty hub).

create or replace function public.list_my_accountability_group_ids()
returns table (
  group_id uuid,
  relation text,
  sort_at timestamptz
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select g.id, 'owned'::text, g.created_at
  from public.accountability_groups g
  where g.created_by = auth.uid()

  union all

  select gm.group_id, 'member'::text, gm.joined_at
  from public.group_members gm
  where gm.user_id = auth.uid()
    and not exists (
      select 1
      from public.accountability_groups g2
      where g2.id = gm.group_id
        and g2.created_by = auth.uid()
    )
$$;

revoke all on function public.list_my_accountability_group_ids() from public;
grant execute on function public.list_my_accountability_group_ids() to authenticated;

create or replace function public.get_accountability_group_for_viewer(p_group_id uuid)
returns table (
  id uuid,
  name text,
  goal text,
  invite_code text,
  max_members int,
  join_mode text,
  invites_enabled boolean,
  created_by uuid
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
    g.created_by
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
