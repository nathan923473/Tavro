# Manually approve a creator (launch process)

1. Run `002_member_creator_accounts.sql` and `005_creator_social_verification.sql` in Supabase SQL Editor.
2. Make yourself admin (replace email):

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

3. Use the admin UI: log in as admin → **Profile** → **Review creator applications** (`/admin/creator-applications`).

4. (Optional) Request ownership verification only if you need Instagram proof; then confirm the DM. This does not approve creator access by itself.

5. Click **Approve creator** to unlock Creator Studio on their existing account.

SQL fallback (admin JWT/session required for RPC from client; in SQL editor use service role or run as postgres):

```sql
select public.admin_confirm_verification('APPLICATION_UUID');
select public.approve_creator_application('APPLICATION_UUID');
```

6. Creator creates community row in Studio, then can publish public challenges.

## Grant a test account without an application

Use this while developing. It does not approve public applications, and it does not approve every applicant.

1. Run `supabase/migrations/042_admin_test_creator_access.sql` in the Supabase SQL editor.
2. Log in as an admin and open **Profile → Review creator applications** (`/admin/creator-applications`).
3. Under **Test creator access**, enter the test account’s email and choose **Find account**.
4. Choose **Grant creator access**. The account is marked `is_test_account` and `creator_status = approved`. Instagram verification and `/become-creator` are not required.
5. Sign in as that account and open `/studio` to create and manage challenges.
6. Choose **Revoke creator access** on the same page to lock Creator Studio again. Challenges, communities, applications, and accountability groups stay in the database.

Public applications remain in the list below and still need **Approve creator**. Revoke only works for accounts marked as test accounts, so an approved public creator is left unchanged.
