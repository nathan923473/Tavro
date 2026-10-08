-- Support account deletion without cascading away shared challenges/groups.
-- Run once in Supabase SQL Editor after 023.

alter table public.challenges
  alter column created_by drop not null;

alter table public.challenges
  drop constraint if exists challenges_created_by_fkey;

alter table public.challenges
  add constraint challenges_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.accountability_groups
  alter column created_by drop not null;

alter table public.accountability_groups
  drop constraint if exists accountability_groups_created_by_fkey;

alter table public.accountability_groups
  add constraint accountability_groups_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;
