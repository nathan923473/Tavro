-- FIX: "column activity_key does not exist" after a partial 015 / 015b run.
-- Paste in ONE empty Supabase SQL tab (dev stopped, other tabs closed) → Run.

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

-- Check-ins table (if Part B never ran)
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
