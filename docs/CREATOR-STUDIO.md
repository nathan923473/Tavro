# Creator Studio

Run **`supabase/migrations/011_creator_studio.sql`** and **`012_creator_link_analytics.sql`** in the Supabase SQL editor after earlier migrations.

## Routes

| Path | Purpose |
|------|---------|
| `/studio` | Overview, quick actions, current challenge |
| `/studio/challenges` | Active / upcoming / drafts / completed |
| `/studio/challenges/new` | 5-step builder + templates |
| `/studio/community` | Follower stats |
| `/studio/analytics` | Aggregate metrics (counts-only v1) |
| `/studio/shop` | External links |
| `/studio/announcements` | Community or challenge announcements |

Share URLs: `/creator/{slug}/challenges/{inviteSlug}` redirects to `/join/{inviteSlug}`.

`/creator/dashboard` and `/creator/analytics` redirect to Studio.

## Privacy

Creators see aggregate participation only. No weight, mood, reflections, or accountability group data in Studio.

## Accountability groups

Out of scope — no Studio changes to group tables or `/groups`.
