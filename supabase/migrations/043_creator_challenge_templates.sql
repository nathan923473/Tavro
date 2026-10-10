-- Personal challenge templates. A saved template is a copy of plan fields.
-- Using one creates a normal challenge draft and does not edit the template
-- or any existing challenge.

create table if not exists public.creator_challenge_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  short_description text,
  description text,
  goal_description text,
  category text,
  duration_days integer not null check (duration_days between 1 and 400),
  participant_summary text not null,
  schedule jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_challenge_templates_owner_idx
  on public.creator_challenge_templates (owner_id, updated_at desc);

alter table public.creator_challenge_templates enable row level security;

drop policy if exists "Creators read own challenge templates" on public.creator_challenge_templates;
create policy "Creators read own challenge templates"
  on public.creator_challenge_templates for select
  using (auth.uid() = owner_id);

drop policy if exists "Approved creators insert own challenge templates" on public.creator_challenge_templates;
create policy "Approved creators insert own challenge templates"
  on public.creator_challenge_templates for insert
  with check (
    auth.uid() = owner_id
    and public.is_approved_creator(auth.uid())
  );

drop policy if exists "Approved creators delete own challenge templates" on public.creator_challenge_templates;
create policy "Approved creators delete own challenge templates"
  on public.creator_challenge_templates for delete
  using (
    auth.uid() = owner_id
    and public.is_approved_creator(auth.uid())
  );

comment on table public.creator_challenge_templates is
  'Creator-owned copies of challenge plans. Official templates stay in application code.';
