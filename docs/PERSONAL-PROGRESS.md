# Personal Progress & Healthy Habits

## Supabase setup

Run once in SQL Editor:

- If you already ran migration **006**: `supabase/migrations/010_personal_progress_habits.sql`
- If SQL says **`member_goals does not exist`**: use **`supabase/scripts/010b_one_shot_personal_progress.sql`** instead (creates tables + personal progress in one go)

Extends `member_goals` with frequency, pause, and optional `linked_challenge_id`.

Then run `supabase/migrations/046_habit_weekday_schedule.sql`. That adds `schedule_days_mask` (bit 0 = Monday through bit 6 = Sunday; 127 = every day) and optional `reminder_time`. The add-habit form includes a day and time picker. Existing habits stay every day, with no reminder.

## Member flow

- **Home:** Today's habits (one tap), optional mood check-in, linked challenge activity, weekly consistency.
- **Progress:** Manage habits, link habits to joined challenges manually, milestones, optional weight (on by default, can turn off), opt-in group share.
- **Onboarding:** Select 3–5 preset habits.

## Challenge link

Join a challenge → **Progress → My habits → Link to challenge** on a habit. Completing that habit updates challenge progress for the day (single completion in `goal_completions`).

## Privacy

Weight, mood, and reflections are private. Group shares are explicit text only via Progress.
