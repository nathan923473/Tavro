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

## Migration 017

Optional but recommended: `activity_key` + `progress_number` for multiple daily activities and manual steps.

Accountability groups: unchanged.
