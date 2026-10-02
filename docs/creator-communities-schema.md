# Creator Communities — planned Supabase schema (Phase 2)

**Status:** UI + demo data only. Do not run until Supabase is connected.

## Tables (proposed)

| Table | Purpose |
|-------|---------|
| `creator_profiles` | Approved creators; links to `auth.users` |
| `creator_communities` | Public page content: slug, name, bio, brand_color, banner_path, avatar_path |
| `creator_social_links` | platform + url (validated) |
| `community_follows` | user_id + community_id (unique); RLS: user owns their rows |
| `creator_challenges` | Extends challenges with creator_id, status, cover_path |
| `creator_announcements` | Short community posts; creator-only write |

## RLS (summary)

- **Read** communities/challenges: public for approved creators.
- **Write** community: `auth.uid() = creator_profiles.user_id` and `is_approved`.
- **Write** follows: `auth.uid() = user_id` only.
- **No access** to private weigh-ins or group DMs from creator role.

## Storage buckets

- `community-avatars`, `community-banners` — size/type limits, creator-only upload.

We will implement migrations after you confirm Supabase project + env vars.
