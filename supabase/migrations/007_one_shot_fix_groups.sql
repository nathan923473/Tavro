-- Paste ALL of this in Supabase SQL Editor → Run once.
-- Fixes: infinite recursion + "cannot change name of input parameter gid"

drop function if exists public.is_group_member(uuid, uuid) cascade;
drop function if exists public.shares_group_with(uuid, uuid) cascade;

create function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = p_user_id and b.user_id = p_other_user_id
  );
$$;

revoke all on function public.is_group_member(uuid, uuid) from public;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
revoke all on function public.shares_group_with(uuid, uuid) from public;
grant execute on function public.shares_group_with(uuid, uuid) to authenticated;

drop policy if exists "Groups readable by members" on public.accountability_groups;
drop policy if exists "Group members readable by co-members" on public.group_members;
drop policy if exists "Group messages readable by members" on public.group_messages;
drop policy if exists "Group members post messages" on public.group_messages;
drop policy if exists "Group co-members read profile names" on public.profiles;

create policy "Groups readable by members"
  on public.accountability_groups for select
  using (
    created_by = auth.uid()
    or public.is_group_member(id, auth.uid())
  );

create policy "Group members readable by co-members"
  on public.group_members for select
  using (
    user_id = auth.uid()
    or public.is_group_member(group_id, auth.uid())
  );

create policy "Group messages readable by members"
  on public.group_messages for select
  using (public.is_group_member(group_id, auth.uid()));

create policy "Group members post messages"
  on public.group_messages for insert
  with check (
    auth.uid() = author_id
    and public.is_group_member(group_id, auth.uid())
  );

create policy "Group co-members read profile names"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.shares_group_with(id, auth.uid())
  );
