-- Growth loop: onboarding completion flags (participant + creator).

alter table public.challenge_participants
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  add column if not exists creator_onboarding_completed_at timestamptz;
