-- Per-habit weekdays (Mon–Sun bitmask) and optional local reminder time (display / future notifications).

alter table public.member_goals
  add column if not exists schedule_days_mask int not null default 127
    check (schedule_days_mask >= 1 and schedule_days_mask <= 127),
  add column if not exists reminder_time time;

comment on column public.member_goals.schedule_days_mask is
  'Bitmask: bit 0 = Monday … bit 6 = Sunday. 127 = every day.';
comment on column public.member_goals.reminder_time is
  'Optional local time hint (HH:MM:SS); not a push notification yet.';
