-- Timezone-aware challenge scheduling (additive, non-destructive).
-- Backfill: run supabase/scripts/backfill-challenge-timezones.mjs after this migration.

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

comment on column public.profiles.timezone is 'IANA timezone for local display and personal reminders.';
comment on column public.profiles.au_state_or_territory is 'Onboarding UX / fallback only; not used for challenge calendar.';

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

comment on column public.challenges.challenge_timezone is 'Official IANA timezone for challenge calendar and creator schedule.';
comment on column public.challenges.start_at is 'Exact challenge start instant (UTC).';
comment on column public.challenges.end_at is 'Exclusive end instant: start of day after end_date in challenge_timezone.';

create index if not exists challenges_start_at_idx
  on public.challenges (start_at)
  where start_at is not null;
