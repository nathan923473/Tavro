-- Post-challenge performance reports (one row per public creator challenge, idempotent).

create table if not exists public.creator_challenge_reports (
  challenge_id uuid primary key references public.challenges (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  report jsonb not null,
  generated_at timestamptz not null default now()
);

create index if not exists creator_challenge_reports_created_by_idx
  on public.creator_challenge_reports (created_by, generated_at desc);

alter table public.creator_challenge_reports enable row level security;

create policy "Creators read own challenge reports"
  on public.creator_challenge_reports for select
  using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.created_by = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Creators insert own challenge reports"
  on public.creator_challenge_reports for insert
  with check (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_id
        and c.created_by = auth.uid()
        and c.created_by = created_by
    )
  );

comment on table public.creator_challenge_reports is
  'Frozen JSON report generated when a public creator challenge ends; one per challenge.';
