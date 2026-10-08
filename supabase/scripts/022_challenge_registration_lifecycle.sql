-- One-shot: run in Supabase SQL Editor (same as migration 022)

alter table public.challenges
  add column if not exists allow_late_join boolean not null default false;

alter table public.challenges
  add column if not exists late_join_until timestamptz;

create table if not exists public.challenge_participant_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  kind text not null check (kind in ('registered', 'starts_in_7d', 'starts_in_1d', 'started')),
  send_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id, kind)
);

create index if not exists challenge_participant_reminders_due_idx
  on public.challenge_participant_reminders (send_at)
  where sent_at is null;

alter table public.challenge_participant_reminders enable row level security;

drop policy if exists "Users read own challenge reminders" on public.challenge_participant_reminders;
create policy "Users read own challenge reminders"
  on public.challenge_participant_reminders for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages challenge reminders" on public.challenge_participant_reminders;
create policy "Service role manages challenge reminders"
  on public.challenge_participant_reminders for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
