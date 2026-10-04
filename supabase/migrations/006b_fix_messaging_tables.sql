-- Run this if 006 failed with: column "author_id" does not exist
-- (Usually means group_messages / challenge_messages existed from an older partial run.)

drop policy if exists "Group messages readable by members" on public.group_messages;
drop policy if exists "Group members post messages" on public.group_messages;
drop policy if exists "Challenge messages readable by participants" on public.challenge_messages;
drop policy if exists "Challenge messages post by participants" on public.challenge_messages;

drop table if exists public.challenge_messages cascade;
drop table if exists public.group_messages cascade;

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index group_messages_group_idx
  on public.group_messages (group_id, created_at desc);

create table public.challenge_messages (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_role text not null check (author_role in ('creator', 'member')),
  body text not null,
  created_at timestamptz not null default now()
);

create index challenge_messages_challenge_idx
  on public.challenge_messages (challenge_id, created_at asc);

alter table public.group_messages enable row level security;
alter table public.challenge_messages enable row level security;

create policy "Group messages readable by members"
  on public.group_messages for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid()
    )
  );

create policy "Group members post messages"
  on public.group_messages for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid()
    )
  );

create policy "Challenge messages readable by participants"
  on public.challenge_messages for select
  using (
    exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenge_id and cp.user_id = auth.uid()
    )
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.created_by = auth.uid()
    )
  );

create policy "Challenge messages post by participants"
  on public.challenge_messages for insert
  with check (
    auth.uid() = author_id
    and (
      exists (
        select 1 from public.challenge_participants cp
        where cp.challenge_id = challenge_id and cp.user_id = auth.uid()
      )
      or exists (
        select 1 from public.challenges c
        where c.id = challenge_id and c.created_by = auth.uid()
      )
    )
  );
