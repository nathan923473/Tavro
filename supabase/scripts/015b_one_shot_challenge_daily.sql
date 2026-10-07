-- ONE-SHOT: Challenge daily progress (015 + 017)
-- How to run:
--   1. Close every other Supabase SQL Editor tab.
--   2. Stop local dev (Ctrl+C on npm run dev:alt).
--   3. New empty query → paste ENTIRE file → Run once.
--   4. If deadlock: wait 30s, Run again.
--
-- If you already got "activity_key does not exist", run 015c_fix_activity_key.sql first,
-- then run this file again OR just run 015c (it finishes the job).

-- ========== Part A: schedule completions (base table — matches first 015 run) ==========
create table if not exists public.challenge_schedule_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  schedule_item_id uuid not null references public.challenge_schedule_items (id) on delete cascade,
  completed_on date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default now(),
  unique (user_id, schedule_item_id, completed_on)
);

-- ========== Part A2: 017 columns (must run BEFORE index on activity_key) ==========
alter table public.challenge_schedule_completions
  add column if not exists activity_key text not null default 'primary';
alter table public.challenge_schedule_completions
  add column if not exists progress_number numeric;

alter table public.challenge_schedule_completions
  drop constraint if exists challenge_schedule_completions_user_id_schedule_item_id_comple_key;
alter table public.challenge_schedule_completions
  drop constraint if exists challenge_schedule_completions_user_id_schedule_item_id_completed_on_key;

create unique index if not exists challenge_schedule_completions_unique_per_activity
  on public.challenge_schedule_completions (user_id, schedule_item_id, completed_on, activity_key);

create index if not exists challenge_schedule_completions_user_challenge_idx
  on public.challenge_schedule_completions (user_id, challenge_id, completed_on);

alter table public.challenge_schedule_completions enable row level security;

drop policy if exists "Users manage own schedule completions" on public.challenge_schedule_completions;
create policy "Users manage own schedule completions"
  on public.challenge_schedule_completions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Creators read aggregate completions for own challenges" on public.challenge_schedule_completions;
create policy "Creators read aggregate completions for own challenges"
  on public.challenge_schedule_completions for select
  using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.created_by = auth.uid()
    )
  );

-- ========== Part B: private daily check-ins ==========
create table if not exists public.challenge_daily_check_ins (
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  check_in_date date not null,
  mood text check (mood in ('rough', 'okay', 'good', 'great')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  primary key (user_id, challenge_id, check_in_date)
);

alter table public.challenge_daily_check_ins enable row level security;

drop policy if exists "Users manage own challenge check-ins" on public.challenge_daily_check_ins;
create policy "Users manage own challenge check-ins"
  on public.challenge_daily_check_ins for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
