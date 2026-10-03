# Member vs creator accounts — architecture

## One app, one auth system

All users sign up as **regular members** (`profiles.creator_status = 'none'`).  
**Approved creators** gain extra capabilities; same login, same navigation shell.

| Capability | Member | Approved creator |
|------------|--------|------------------|
| Goals, progress, groups (demo → DB later) | ✅ | ✅ |
| Join public creator challenges | ✅ | ✅ |
| Follow communities | ✅ | ✅ |
| Create **private** invite-only challenges | ✅ | ✅ |
| Public creator community page | ❌ | ✅ |
| Creator Studio | ❌ | ✅ |
| Publish **public** challenges to discovery | ❌ | ✅ |
| Analytics & announcements | ❌ | ✅ |

## Enforcement

- **RLS** on `challenges`, `creator_communities`, `creator_applications` (see `002_member_creator_accounts.sql`).
- **Server checks** in `/studio` routes via `requireApprovedCreator()`.
- Frontend badges are informational only.

## Manual creator approval (launch)

1. User submits **Become a creator** → row in `creator_applications`.
2. Admin sets `profiles.is_admin = true` once in SQL for your account.
3. Admin runs `select approve_creator_application('<app_id>');` or uses future admin UI.

## Routes

| Route | Audience |
|-------|----------|
| `/signup`, `/login` | Everyone |
| `/become-creator` | Logged-in members |
| `/studio` | Approved creators (server gate) |
| `/challenges/create` | Members — private challenges only |
| `/creator/[slug]` | Public community pages |

Existing demo pages remain when logged out or while features are migrated to Supabase.
