# Creator social verification

## Flow

1. Member submits **Become a creator** with required **primary social link**.
2. Backend RPC `submit_creator_application` creates row:
   - `status = pending_verification`
   - unique `verification_code` (48h expiry)
   - `user_id = auth.uid()` (never client-supplied)
3. Applicant verifies ownership:
   - **Bio:** add code to public bio → **Check my bio** (automated fetch, best-effort)
   - **DM:** message official handle → admin **Confirm verification manually**
4. On success → `verification_state = verified`, `status = awaiting_review`
5. **Admin only** approves → `approve_creator_application` sets `profiles.creator_status = approved`

Social verification **never** auto-approves creator privileges.

## Database

Run `supabase/migrations/005_creator_social_verification.sql` after 002.

## Admin

1. Set `profiles.is_admin = true` for your user (see `docs/approve-creator.md`).
2. Open `/admin/creator-applications`.

Optional env:

```env
OFFICIAL_VERIFICATION_DM_TARGET=@yourbrand on Instagram
```

## Security tests

```bash
npm run test:creator-security
```

See `scripts/test-creator-security.mjs` for what is checked.
