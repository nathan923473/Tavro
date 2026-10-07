-- Fix: infinite recursion in policy for relation "challenge_participants"
-- Cause: RLS policies / security definer helpers reading challenge_participants
-- without SET row_security = off (same fix pattern as group RLS in 008).

drop function if exists public.is_challenge_member(uuid, uuid) cascade;
drop function if exists public.is_challenge_host(uuid, uuid) cascade;
drop function if exists public.shares_challenge_with(uuid, uuid) cascade;

create function public.is_challenge_member(p_challenge_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select p_user_id is not null
    and exists (
      select 1
      from public.challenge_participants cp
      where cp.challenge_id = p_challenge_id
        and cp.user_id = p_user_id
    );
$$;

create function public.is_challenge_host(p_challenge_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select p_user_id is not null
    and exists (
      select 1
      from public.challenges c
      left join public.creator_communities cc on cc.id = c.community_id
      where c.id = p_challenge_id
        and (
          c.created_by = p_user_id
          or cc.owner_id = p_user_id
        )
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
  select p_user_id is not null
    and p_other_user_id is not null
    and (
      exists (
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
        left join public.creator_communities cc on cc.id = c.community_id
        where cp.user_id = p_user_id
          and (
            c.created_by = p_other_user_id
            or cc.owner_id = p_other_user_id
          )
      )
      or exists (
        select 1
        from public.challenges c
        where c.created_by = p_user_id
          and public.is_challenge_member(c.id, p_other_user_id)
      )
    );
$$;

revoke all on function public.is_challenge_member(uuid, uuid) from public;
grant execute on function public.is_challenge_member(uuid, uuid) to authenticated;
grant execute on function public.is_challenge_member(uuid, uuid) to anon;

revoke all on function public.is_challenge_host(uuid, uuid) from public;
grant execute on function public.is_challenge_host(uuid, uuid) to authenticated;
grant execute on function public.is_challenge_host(uuid, uuid) to anon;

revoke all on function public.shares_challenge_with(uuid, uuid) from public;
grant execute on function public.shares_challenge_with(uuid, uuid) to authenticated;

-- Participant rows: one SELECT policy, no inline subqueries on this table.
drop policy if exists "Participants read own memberships" on public.challenge_participants;
drop policy if exists "Challenge participants readable by co-participants" on public.challenge_participants;
drop policy if exists "Challenge participants readable" on public.challenge_participants;

create policy "Challenge participants readable"
  on public.challenge_participants for select
  using (
    auth.uid() = user_id
    or public.is_challenge_member(challenge_id, auth.uid())
    or public.is_challenge_host(challenge_id, auth.uid())
    or exists (
      select 1
      from public.challenges c
      where c.id = challenge_id
        and c.visibility = 'public'
        and c.publish_status in ('published', 'scheduled', 'archived')
    )
  );

-- Challenges policy: avoid inline challenge_participants (recursion via embed count).
drop policy if exists "Challenges readable" on public.challenges;
drop policy if exists "Public challenges readable by all" on public.challenges;

create policy "Challenges readable"
  on public.challenges for select
  using (
    created_by = auth.uid()
    or public.is_challenge_member(id, auth.uid())
    or (
      visibility = 'public'
      and publish_status in ('published', 'scheduled', 'archived')
    )
  );

-- Helpers used elsewhere must bypass RLS when touching participants.
create or replace function public.user_can_read_challenge(ch_id uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.challenges c
    where c.id = ch_id
      and (
        c.created_by = uid
        or (
          c.visibility = 'public'
          and c.publish_status in ('published', 'scheduled', 'archived')
        )
        or public.is_challenge_member(c.id, uid)
      )
  );
$$;

grant execute on function public.user_can_read_challenge(uuid, uuid) to authenticated;
grant execute on function public.user_can_read_challenge(uuid, uuid) to anon;

drop policy if exists "Group co-members read profile names" on public.profiles;
drop policy if exists "Challenge co-participants read profile names" on public.profiles;
drop policy if exists "Group and challenge peers read profile names" on public.profiles;

create policy "Group and challenge peers read profile names"
  on public.profiles for select
  using (
    public.shares_group_with(id, auth.uid())
    or public.shares_challenge_with(id, auth.uid())
  );
