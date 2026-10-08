# Account deletion (Tavro)

## Behaviour summary

- **Participants:** Personal data removed; challenge memberships and progress rows deleted; other participants and challenges unchanged.
- **Creators:** Public challenges archived and set private before community removal; `created_by` set null via FK (migration 024); participants keep progress.
- **Accountability groups:** If the departing user created a group with other members, ownership transfers to the longest-tenured remaining member; otherwise the empty group is deleted.

## Required Supabase setup

1. Run `supabase/migrations/024_account_deletion.sql` (or `supabase/scripts/024_account_deletion.sql`).
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set on the server (never in the browser).

## Safe testing

1. Create two test users (participant + creator with a public challenge and a group with both users).
2. Delete the participant — verify creator challenge and group still work.
3. Delete the creator — verify challenge is archived, participant can still open hub progress.
4. Cancel flow — confirm checkbox and DELETE text block deletion.

Do not run deletion tests against production accounts.
