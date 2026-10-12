-- Group members can read Progress habits and completions that were shared
-- into their accountability group.
--
-- Policies that subquery member_goal_group_shares directly run as the caller,
-- so row level security on that table hides other members' share rows and the
-- habit never becomes visible. These helpers bypass row security and only
-- return true when the viewer and the habit owner are both in the share's group.

create or replace function public.viewer_can_read_shared_member_goal(p_goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.member_goal_group_shares s
    join public.member_goals g on g.id = s.goal_id and g.user_id = s.user_id
    where s.goal_id = p_goal_id
      and g.active = true
      and exists (
        select 1
        from public.group_members viewer
        where viewer.group_id = s.group_id
          and viewer.user_id = auth.uid()
      )
      and exists (
        select 1
        from public.group_members owner
        where owner.group_id = s.group_id
          and owner.user_id = s.user_id
      )
  );
$$;

create or replace function public.viewer_can_read_shared_goal_completion(
  p_goal_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.member_goal_group_shares s
    where s.goal_id = p_goal_id
      and s.user_id = p_user_id
      and exists (
        select 1
        from public.group_members viewer
        where viewer.group_id = s.group_id
          and viewer.user_id = auth.uid()
      )
      and exists (
        select 1
        from public.group_members owner
        where owner.group_id = s.group_id
          and owner.user_id = s.user_id
      )
  );
$$;

revoke all on function public.viewer_can_read_shared_member_goal(uuid) from public, anon, authenticated;
grant execute on function public.viewer_can_read_shared_member_goal(uuid) to authenticated;

revoke all on function public.viewer_can_read_shared_goal_completion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.viewer_can_read_shared_goal_completion(uuid, uuid) to authenticated;

drop policy if exists "Group members read shared habits" on public.member_goals;
create policy "Group members read shared habits"
  on public.member_goals for select
  using (public.viewer_can_read_shared_member_goal(id));

drop policy if exists "Group members read shared habit completions" on public.goal_completions;
create policy "Group members read shared habit completions"
  on public.goal_completions for select
  using (public.viewer_can_read_shared_goal_completion(goal_id, user_id));

drop policy if exists "Members read habit shares" on public.member_goal_group_shares;
create policy "Members read habit shares"
  on public.member_goal_group_shares for select
  using (
    auth.uid() = user_id
    or public.is_group_member(group_id, auth.uid())
  );
