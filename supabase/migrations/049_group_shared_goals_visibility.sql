-- Allow accountability group members to read co-members' habits that were shared
-- with the group (member_goal_group_shares) and those habits' completion rows.
-- Without these policies, PostgREST embeds on member_goals return null and
-- goal_completions queries from peers return empty.

drop policy if exists "Group members read co-member shared goals" on public.member_goals;
create policy "Group members read co-member shared goals"
  on public.member_goals for select
  using (
    exists (
      select 1
      from public.member_goal_group_shares s
      where s.member_goal_id = member_goals.id
        and public.is_group_member(s.group_id, auth.uid())
    )
  );

drop policy if exists "Group members read shared habit completions" on public.goal_completions;
create policy "Group members read shared habit completions"
  on public.goal_completions for select
  using (
    exists (
      select 1
      from public.member_goal_group_shares s
      where s.member_goal_id = goal_completions.goal_id
        and public.is_group_member(s.group_id, auth.uid())
    )
  );
