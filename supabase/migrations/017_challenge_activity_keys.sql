-- Multiple activity completions per schedule day + optional manual progress (e.g. steps).

alter table public.challenge_schedule_completions
  add column if not exists activity_key text not null default 'primary',
  add column if not exists progress_number numeric;

alter table public.challenge_schedule_completions
  drop constraint if exists challenge_schedule_completions_user_id_schedule_item_id_comple_key;

alter table public.challenge_schedule_completions
  drop constraint if exists challenge_schedule_completions_user_id_schedule_item_id_completed_on_key;

create unique index if not exists challenge_schedule_completions_unique_per_activity
  on public.challenge_schedule_completions (user_id, schedule_item_id, completed_on, activity_key);
