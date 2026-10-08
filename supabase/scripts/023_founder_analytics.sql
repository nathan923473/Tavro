-- Duplicate of supabase/migrations/023_founder_analytics.sql for manual SQL Editor runs.

-- Founder analytics: events, signup/join attribution, manual acquisition expenses.
-- Non-destructive additive migration.

alter table public.profiles
  add column if not exists signup_acquisition_source text
    check (
      signup_acquisition_source is null
      or signup_acquisition_source in (
        'creator_link',
        'participant_referral',
        'direct',
        'organic_search',
        'paid',
        'unknown'
      )
    );

alter table public.profiles
  add column if not exists referrer_user_id uuid references public.profiles (id) on delete set null;

alter table public.profiles
  add column if not exists attributed_creator_id uuid references public.profiles (id) on delete set null;

alter table public.profiles
  add column if not exists attributed_challenge_id uuid references public.challenges (id) on delete set null;

alter table public.profiles
  add column if not exists attribution_recorded_at timestamptz;

alter table public.profiles
  add column if not exists attribution_metadata jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists is_test_account boolean not null default false;

create index if not exists profiles_attributed_creator_id_idx
  on public.profiles (attributed_creator_id)
  where attributed_creator_id is not null;

create index if not exists profiles_referrer_user_id_idx
  on public.profiles (referrer_user_id)
  where referrer_user_id is not null;

create index if not exists profiles_created_at_idx on public.profiles (created_at);

alter table public.challenge_participants
  add column if not exists join_source text
    check (
      join_source is null
      or join_source in (
        'challenge_landing',
        'creator_page',
        'in_app',
        'unknown'
      )
    );

alter table public.challenge_participants
  add column if not exists referrer_user_id uuid references public.profiles (id) on delete set null;

alter table public.challenge_participants
  add column if not exists is_new_platform_user_at_join boolean;

alter table public.challenge_participants
  add column if not exists joined_challenge_id uuid references public.challenges (id) on delete set null;

update public.challenge_participants
set joined_challenge_id = challenge_id
where joined_challenge_id is null;

create table if not exists public.platform_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  occurred_at timestamptz not null default now(),
  user_id uuid references public.profiles (id) on delete set null,
  creator_id uuid references public.profiles (id) on delete set null,
  challenge_id uuid references public.challenges (id) on delete set null,
  community_id uuid references public.creator_communities (id) on delete set null,
  session_key text,
  idempotency_key text unique,
  properties jsonb not null default '{}'::jsonb
);

create index if not exists platform_analytics_events_type_time_idx
  on public.platform_analytics_events (event_type, occurred_at desc);

create index if not exists platform_analytics_events_user_time_idx
  on public.platform_analytics_events (user_id, occurred_at desc)
  where user_id is not null;

create index if not exists platform_analytics_events_challenge_time_idx
  on public.platform_analytics_events (challenge_id, occurred_at desc)
  where challenge_id is not null;

create table if not exists public.founder_acquisition_expenses (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  category text not null check (
    category in ('paid_marketing', 'creator_acquisition', 'other')
  ),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'AUD',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.platform_analytics_events enable row level security;
alter table public.founder_acquisition_expenses enable row level security;

drop policy if exists platform_analytics_events_admin_select on public.platform_analytics_events;
create policy platform_analytics_events_admin_select
  on public.platform_analytics_events
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists founder_acquisition_expenses_admin_all on public.founder_acquisition_expenses;
create policy founder_acquisition_expenses_admin_all
  on public.founder_acquisition_expenses
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
