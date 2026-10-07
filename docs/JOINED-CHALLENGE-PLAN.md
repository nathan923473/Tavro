# Joined challenge participant experience

## Existing schema (reused)

| Piece | Table / source |
|-------|----------------|
| Membership | `challenge_participants` |
| Daily plan | `challenge_schedule_items` (Studio builder) |
| Activity done | `challenge_schedule_completions` (+ `activity_key`, `progress_number` in 017) |
| Private mood/note | `challenge_daily_check_ins` |
| Creator updates | `creator_announcements` |
| Public landing | `/creator/.../challenges/...` + `/join/...` (unchanged for non-members) |

## Routing

- **Not joined:** public landing (Join Free, share prominent).
- **Joined:** `/challenges/{id}` with in-challenge tabs (not bottom nav).
- Visiting public URL while joined → redirect to hub.

## Migrations 015 + 017

If `015_challenge_daily_progress.sql` deadlocks in the SQL Editor, use **`supabase/scripts/015b_one_shot_challenge_daily.sql`** instead (close other tabs, stop dev server, run once, retry after 30s if deadlock).

Accountability groups: unchanged.
