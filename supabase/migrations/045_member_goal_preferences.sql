-- Participant goal preferences (onboarding + profile). No medical data.

alter table public.profiles
  add column if not exists work_towards text;

alter table public.profiles
  add column if not exists growth_friction text;

alter table public.profiles
  drop constraint if exists profiles_work_towards_check;

alter table public.profiles
  add constraint profiles_work_towards_check
  check (
    work_towards is null
    or work_towards in (
      'manage_weight',
      'healthier_habits',
      'improve_fitness',
      'more_active',
      'stay_consistent'
    )
  );

alter table public.profiles
  drop constraint if exists profiles_growth_friction_check;

alter table public.profiles
  add constraint profiles_growth_friction_check
  check (
    growth_friction is null
    or growth_friction in (
      'motivation',
      'consistency',
      'knowing_what_to_do',
      'support',
      'getting_back_on_track'
    )
  );

comment on column public.profiles.work_towards is
  'Self-reported focus from onboarding; used for light in-app personalisation.';

comment on column public.profiles.growth_friction is
  'Optional difficulty area from onboarding; nullable.';
