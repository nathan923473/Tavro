-- ONE-SHOT: Run in Supabase SQL Editor after 047_shared_member_goal_commitments.sql
-- Fixes: group members cannot see co-members' shared Progress habits or completions.
--
-- member_goal_group_shares columns: member_goal_id, group_id, user_id (NOT goal_id)

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
