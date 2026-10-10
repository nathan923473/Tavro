# Creator application & approval (Tavro)

## Default flow (no invite links)

1. Public landing: `/creators`
2. Member applies at `/become-creator` (same account as members)
3. Application status: `awaiting_review` (Instagram DM **not** required by default)
4. Admin reviews at `/admin/creator-applications`
5. **Approve creator** → `profiles.creator_status = approved` → Creator Studio unlocks

There is **no private creator invitation system**. Challenge/group invite links are unrelated.

## Test accounts

Admins can grant or revoke Creator Studio for one test account from
`/admin/creator-applications` without an application or Instagram check.
See `docs/approve-creator.md`. That path sets `profiles.creator_status = approved`
and `is_test_account = true`. It does not approve the public application queue.

## Optional ownership verification

Admins may click **Request ownership verification** when needed. That sets
`pending_verification` and shows the applicant the DM code panel. After checking
Instagram, admin uses **Confirm Instagram ownership**. This stays separate from
**Approve creator**.

Bio verification is not used.

## Configure official Instagram handle (only if using DM checks)

```env
OFFICIAL_VERIFICATION_DM_TARGET=@your_real_handle on Instagram
```

## Database

Run if not already applied:

- `039_fix_creator_application_status_guard.sql`
- `040_dm_only_creator_verification.sql`
- `041_simplify_creator_application_flow.sql`
- `042_admin_test_creator_access.sql`
