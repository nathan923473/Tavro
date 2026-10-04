-- Run once in Supabase SQL Editor (empty tab, paste entire file, Run).
-- Fixes: infinite recursion on accountability_groups / group_members even after 007.
-- Cause: member-check helpers must bypass RLS inside security definer functions.

-- Remove every group-related policy (clears duplicates from partial 006/007 runs)
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'accountability_groups',
        'group_members',
        'group_messages'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
  end loop;
end $$;

drop function if exists public.get_group_by_invite_code(text) cascade;
drop function if exists public.is_group_member(uuid, uuid) cascade;
drop function if exists public.shares_group_with(uuid, uuid) cascade;

create function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
  );
$$;

create function public.shares_group_with(p_other_user_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = p_user_id
      and b.user_id = p_other_user_id
  );
$$;

-- Invite join: exact code lookup without opening all groups to SELECT
create function public.get_group_by_invite_code(p_code text)
returns table (
  id uuid,
  name text,
  invite_code text,
  max_members int
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select g.id, g.name, g.invite_code, g.max_members
  from public.accountability_groups g
  where g.invite_code = trim(p_code)
  limit 1;
$$;

revoke all on function public.is_group_member(uuid, uuid) from public;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
revoke all on function public.shares_group_with(uuid, uuid) from public;
grant execute on function public.shares_group_with(uuid, uuid) to authenticated;
revoke all on function public.get_group_by_invite_code(text) from public;
grant execute on function public.get_group_by_invite_code(text) to authenticated;

-- accountability_groups
create policy "Groups readable by creator"
  on public.accountability_groups for select
  using (created_by = auth.uid());

create policy "Groups readable by members"
  on public.accountability_groups for select
  using (public.is_group_member(id, auth.uid()));

create policy "Authenticated create groups"
  on public.accountability_groups for insert
  with check (auth.uid() = created_by);

-- group_members
create policy "Group members readable by self"
  on public.group_members for select
  using (user_id = auth.uid());

create policy "Group members readable by co-members"
  on public.group_members for select
  using (public.is_group_member(group_id, auth.uid()));

create policy "Users join groups"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create policy "Users leave own membership"
  on public.group_members for delete
  using (auth.uid() = user_id);

-- group_messages
create policy "Group messages readable by members"
  on public.group_messages for select
  using (public.is_group_member(group_id, auth.uid()));

create policy "Group members post messages"
  on public.group_messages for insert
  with check (
    auth.uid() = author_id
    and public.is_group_member(group_id, auth.uid())
  );

-- profiles (group UI names) — drop only the group policy, recreate
drop policy if exists "Group co-members read profile names" on public.profiles;

create policy "Group co-members read profile names"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.shares_group_with(id, auth.uid())
  );
