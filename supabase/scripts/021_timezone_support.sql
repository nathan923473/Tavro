-- One-shot: timezone columns (same as migrations/021_timezone_support.sql).
-- After running in SQL Editor: node supabase/scripts/backfill-challenge-timezones.mjs

alter table public.profiles
  add column if not exists au_state_or_territory text,
  add column if not exists timezone text,
  add column if not exists timezone_source text,
  add column if not exists timezone_confirmed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_au_state_or_territory_check;

alter table public.profiles
  add constraint profiles_au_state_or_territory_check
  check (
    au_state_or_territory is null
    or au_state_or_territory in (
      'vic', 'nsw', 'qld', 'sa', 'wa', 'tas', 'act', 'nt', 'outside_australia'
    )
  );

alter table public.challenges
  add column if not exists challenge_timezone text,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists schedule_mode text not null default 'fixed_instant';

alter table public.challenges
  drop constraint if exists challenges_schedule_mode_check;

alter table public.challenges
  add constraint challenges_schedule_mode_check
  check (schedule_mode in ('fixed_instant', 'start_anytime'));

create index if not exists challenges_start_at_idx
  on public.challenges (start_at)
  where start_at is not null;
