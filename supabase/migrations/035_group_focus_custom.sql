-- Allow custom group focus label.

alter table public.accountability_groups
  add column if not exists focus_custom_label text not null default '';

alter table public.accountability_groups
  drop constraint if exists accountability_groups_focus_type_check;

alter table public.accountability_groups
  add constraint accountability_groups_focus_type_check
  check (focus_type in (
    'walking',
    'gym',
    'nutrition',
    'weight_loss',
    'routines',
    'general',
    'custom'
  ));

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
  focus_custom_label text,
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
    coalesce(g.focus_custom_label, '') as focus_custom_label,
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
