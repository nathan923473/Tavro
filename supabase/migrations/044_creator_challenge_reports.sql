-- Post-challenge performance snapshots for Creator Studio.
-- One row per challenge. The first insert wins; later reads return that snapshot.
-- payload is aggregate counts only (no participant ids, notes, or health data).
-- A participant is completed when progress_percent >= 80.

create table if not exists public.creator_challenge_reports (
  challenge_id uuid primary key references public.challenges (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  generated_at timestamptz not null default now(),
  payload jsonb not null,
  constraint creator_challenge_reports_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists creator_challenge_reports_creator_idx
  on public.creator_challenge_reports (creator_id, generated_at desc);

alter table public.creator_challenge_reports enable row level security;

drop policy if exists "Creators read own challenge reports" on public.creator_challenge_reports;
create policy "Creators read own challenge reports"
  on public.creator_challenge_reports for select
  using (
    creator_id = auth.uid()
    and public.creator_owns_challenge(challenge_id, auth.uid())
  );

drop policy if exists "Creators insert own challenge reports" on public.creator_challenge_reports;
create policy "Creators insert own challenge reports"
  on public.creator_challenge_reports for insert
  with check (
    creator_id = auth.uid()
    and public.creator_owns_challenge(challenge_id, auth.uid())
    and (
      public.is_approved_creator(auth.uid())
      or public.is_admin(auth.uid())
    )
  );

comment on table public.creator_challenge_reports is
  'Immutable aggregate snapshot for a finished creator challenge. Completion is progress_percent >= 80.';
