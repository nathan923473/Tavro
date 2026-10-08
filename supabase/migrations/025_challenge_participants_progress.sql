-- Ensure join/progress columns exist (some projects skipped 006/014).
-- Safe to run multiple times.

alter table public.challenge_participants
  add column if not exists progress_percent int not null default 0;

alter table public.challenge_participants
  drop constraint if exists challenge_participants_progress_percent_check;

alter table public.challenge_participants
  add constraint challenge_participants_progress_percent_check
  check (progress_percent >= 0 and progress_percent <= 100);

alter table public.challenge_participants
  add column if not exists last_activity_date date;

alter table public.challenge_participants
  add column if not exists onboarding_completed_at timestamptz;
