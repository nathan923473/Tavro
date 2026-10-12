-- Weekday mask and optional reminder time for personal habits.
-- Bit 0 = Monday … bit 6 = Sunday. 127 = every day.
-- Existing rows stay every day, with no reminder.

alter table public.member_goals
  add column if not exists schedule_days_mask smallint not null default 127
    check (schedule_days_mask between 1 and 127),
  add column if not exists reminder_time time;
