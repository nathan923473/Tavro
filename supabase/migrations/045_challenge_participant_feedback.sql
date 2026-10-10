-- Optional post-challenge participant feedback (one row per user per challenge).
-- This is the feedback table used by Creator Studio reports.
-- Numbered 045 because 040 and 041 in this project are creator-verification migrations,
-- and 044 already creates creator_challenge_reports (payload / creator_id).

create table if not exists public.challenge_participant_feedback (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  what_helped text,
  what_improve text,
  share_written_feedback boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create index if not exists challenge_participant_feedback_challenge_idx
  on public.challenge_participant_feedback (challenge_id);

alter table public.challenge_participant_feedback enable row level security;

drop policy if exists "Participants read own feedback" on public.challenge_participant_feedback;
create policy "Participants read own feedback"
  on public.challenge_participant_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "Participants insert own feedback" on public.challenge_participant_feedback;
create policy "Participants insert own feedback"
  on public.challenge_participant_feedback for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenge_participant_feedback.challenge_id
        and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Participants update own feedback" on public.challenge_participant_feedback;
create policy "Participants update own feedback"
  on public.challenge_participant_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.challenge_participant_feedback is
  'Voluntary 1–5 challenge feedback; creators see aggregates via frozen reports only.';
