-- Late joining + scheduled participant reminders (additive)

alter table public.challenges
  add column if not exists allow_late_join boolean not null default false;

alter table public.challenges
  add column if not exists late_join_until timestamptz;

comment on column public.challenges.allow_late_join is
  'When true, participants may join after start_at until late_join_until (or challenge end).';

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

create policy "Users read own challenge reminders"
  on public.challenge_participant_reminders for select
  using (auth.uid() = user_id);

create policy "Service role manages challenge reminders"
  on public.challenge_participant_reminders for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
