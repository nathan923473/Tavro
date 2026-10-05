# Personal Progress & Healthy Habits

## Supabase setup

Run once in SQL Editor:

`supabase/migrations/010_personal_progress_habits.sql`

Extends `member_goals` with frequency, pause, and optional `linked_challenge_id`.

## Member flow

- **Home:** Today's habits (one tap), optional mood check-in, linked challenge activity, weekly consistency.
- **Progress:** Manage habits, link habits to joined challenges manually, milestones, optional weight (on by default, can turn off), opt-in group share.
- **Onboarding:** Select 3–5 preset habits.

## Challenge link

Join a challenge → **Progress → My habits → Link to challenge** on a habit. Completing that habit updates challenge progress for the day (single completion in `goal_completions`).

## Privacy

Weight, mood, and reflections are private. Group shares are explicit text only via Progress.
