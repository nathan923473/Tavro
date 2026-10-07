-- Paste entire file in Supabase SQL Editor (one tab) if migration 018 is not applied.

drop function if exists public.is_challenge_member(uuid, uuid) cascade;
drop function if exists public.shares_challenge_with(uuid, uuid) cascade;

create function public.is_challenge_member(p_challenge_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.challenge_participants cp
    where cp.challenge_id = p_challenge_id
      and cp.user_id = p_user_id
  );
$$;

create function public.shares_challenge_with(p_other_user_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.challenge_participants a
    join public.challenge_participants b
      on a.challenge_id = b.challenge_id
    where a.user_id = p_user_id
      and b.user_id = p_other_user_id
  )
  or exists (
    select 1
    from public.challenge_participants cp
    join public.challenges c on c.id = cp.challenge_id
    where cp.user_id = p_user_id
      and (
        c.created_by = p_other_user_id
        or (
          c.community_id is not null
          and exists (
            select 1 from public.creator_communities cc
            where cc.id = c.community_id
              and cc.owner_id = p_other_user_id
          )
        )
      )
  )
  or exists (
    select 1
    from public.challenges c
    where c.created_by = p_user_id
      and public.is_challenge_member(c.id, p_other_user_id)
  );
$$;

revoke all on function public.is_challenge_member(uuid, uuid) from public;
grant execute on function public.is_challenge_member(uuid, uuid) to authenticated;

revoke all on function public.shares_challenge_with(uuid, uuid) from public;
grant execute on function public.shares_challenge_with(uuid, uuid) to authenticated;

drop policy if exists "Challenge participants readable by co-participants" on public.challenge_participants;

create policy "Challenge participants readable by co-participants"
  on public.challenge_participants for select
  using (
    auth.uid() = user_id
    or public.is_challenge_member(challenge_id, auth.uid())
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.created_by = auth.uid()
    )
    or exists (
      select 1
      from public.challenges c
      join public.creator_communities cc on cc.id = c.community_id
      where c.id = challenge_id and cc.owner_id = auth.uid()
    )
  );

drop policy if exists "Group co-members read profile names" on public.profiles;
drop policy if exists "Challenge co-participants read profile names" on public.profiles;

create policy "Group and challenge peers read profile names"
  on public.profiles for select
  using (
    public.shares_group_with(id, auth.uid())
    or public.shares_challenge_with(id, auth.uid())
  );
