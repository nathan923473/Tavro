# Manually approve a creator (launch process)

1. Run `002_member_creator_accounts.sql` and `005_creator_social_verification.sql` in Supabase SQL Editor.
2. Make yourself admin (replace email):

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

3. Run `051_creator_invites_and_onboarding.sql` before using personal invites, new verification codes, or reapply.

4. Personal invites: **Profile** → **Invite a creator** (`/admin/creator-invitations`). The link is single-use, email-bound, and expires. Accepting it records you as the inviter and the approver. It does not use the public application or bio code.

5. Organic applicants: **Profile** → **Review creator applications** (`/admin/creator-applications`).

6. Confirm social verification (bio check, DM, or **Confirm verification manually**).

7. When status is **awaiting_review** and verification is **verified**, click **Approve creator**. **Allow reapply** is only for an application you rejected. Expired codes are refreshed by the applicant, not by a new approval.

SQL fallback (admin JWT/session required for RPC from client; in SQL editor use service role or run as postgres):

```sql
select public.admin_confirm_verification('APPLICATION_UUID');
select public.approve_creator_application('APPLICATION_UUID');
```

8. Creator opens Studio and can publish a public challenge immediately. The setup checklist is optional.
