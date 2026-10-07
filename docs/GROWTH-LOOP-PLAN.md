# Growth loop — inspection & implementation plan

## Feature status (before this work)

| # | Feature | Full | Partial | Missing |
|---|---------|------|---------|---------|
| 1 | Creator discovery/search | | Discover list on `/challenges` | Search, Featured/Active/Upcoming sections, creator cards grid |
| 2 | Notifications | | Follower announcement feed on `/following` | In-app center, bell, prefs, event fan-out |
| 3 | Invite/share | | `/join/{slug}`, copy links, `/creator/…/challenges/…` → redirect join | Instagram landing, Web Share, auth `next`, canonical creator URL |
| 4 | Creator onboarding | | Studio + community setup | Post-approval guided flow + completion flag |
| 5 | Participant challenge onboarding | | Join on card | Short post-join welcome + return after signup |
| 6 | Daily activities/check-in | | Log activity % + schedule in Studio only | Participant “today” view, schedule completions, mood check-in |

## Reuse (do not rebuild)

- **Challenges:** `challenges`, `challenge_participants`, `challenge_schedule_items`, `invite_slug`, `publish_status`, Studio publish actions
- **Creators:** `creator_communities`, approval via `profiles.creator_status`, `/studio`, templates in `challenge-templates.ts`
- **Share:** `CopyLinkButton`, `challengeInvitePath`, `creatorChallengePath`
- **Follow/announcements:** `community_follows`, `creator_announcements`, `FollowerAnnouncementsFeed`
- **Personal progress:** `member_goals`, `goal_completions`, `daily_check_ins` — link via `linked_challenge_id` where applicable
- **Private member challenges:** `/challenges/create`, `visibility = private` — exclude from public discover
- **Accountability groups:** unchanged

## Proposed migrations (run in order after review)

### `014_growth_loop_onboarding.sql`
- `challenge_participants.onboarding_completed_at`
- `profiles.creator_onboarding_completed_at`

### `015_challenge_daily_progress.sql`
- `challenge_schedule_completions` (user + schedule_item + date, unique)
- `challenge_daily_check_ins` (user + challenge + date, mood + optional private note)

### `016_in_app_notifications.sql`
- `app_notifications` (per-user inbox, `read_at`)
- `notification_preferences` (reminders, announcements, new challenges)

RLS: users read/update own notifications & prefs; inserts via security definer RPCs from server actions only.

## Conflicts / risks

- **Duplicate check-offs:** Daily challenge items sync to linked `member_goals` when configured; one completion writes both schedule completion + goal completion.
- **Join URLs:** Keep `/join/{slug}` working; canonical marketing URL `/creator/{slug}/challenges/{inviteSlug}`.
- **Discover:** Only `visibility = public`, `publish_status = published`, approved creator `community_id` set.

## Implementation sequence

1. **Phase 1** — Landing, share, auth `next`, participant onboarding  
2. **Phase 2** — Daily challenge hub, schedule completions, progress, creator message  
3. **Phase 3** — Creator onboarding wizard in Studio  
4. **Phase 4** — `/discover` search + sections  
5. **Phase 5** — Notifications bell, inbox, prefs, hooks on publish/announce  
6. **Phase 6** — Build, mobile paths, RLS checks  
