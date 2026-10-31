# Supabase auth — normal sign-up & log in

## 1. Keys in `.env.local` (project folder, never commit)

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key

# Server-only. Records inbox ownership after a real confirmation link. Never public.
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret

# Cloudflare Turnstile. Production sign-up fails closed until both are set.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret
```

Get keys from Supabase → **Project Settings** → **API** / **API Keys**.

The **service role** key stays in `.env.local` only. Do not prefix it with `NEXT_PUBLIC_`.

## 2. SQL (once per Supabase project)

In **SQL Editor**, run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_member_creator_accounts.sql` (creators/challenges)
3. `supabase/migrations/003_fix_signup_profile_trigger.sql` (**required** for sign-up)
4. `005a` + `005b` (creator verification, if using creator flows)
5. `supabase/migrations/006_member_activity_and_messaging.sql` (**required** for goals, groups, chat, weigh-ins)
6. If 006 errors with **`column "author_id" does not exist`**, run `006b_fix_messaging_tables.sql` (or re-run the updated 006 messaging section)
7. **Accountability groups / group chat** — after 006, run **`007_one_shot_fix_groups.sql`**, then **`008_fix_group_rls_row_security.sql`** (required if create group still shows infinite recursion). Use a **single empty** SQL tab; paste each **whole file** from the top.
8. **Profile & challenge photos** — run **`009_avatars_and_challenge_media.sql`** once. If you get **policy already exists**, run **`009b_one_shot_fix_media.sql`** instead (empty SQL tab, whole file).
9. **Email ownership** — after 051, run **`052_email_ownership_and_auth_limits.sql`**. It does not delete accounts or sessions.

### Groups SQL mistakes

| Error | Fix |
|--------|-----|
| `policy "Group messages readable by members" already exists` (42710) | You ran **CREATE** before **DROP** (often from a partial paste). Run `007a_emergency_drop_group_rls.sql`, then the full `007_one_shot_fix_groups.sql`. |
| `infinite recursion detected in policy for relation "accountability_groups"` | Run **`008_fix_group_rls_row_security.sql`** (after 007). Pull latest app code so create group does not rely on `insert().select()`. |
| `cannot change name of input parameter "gid"` | Drop old functions first — included at the top of `007_one_shot_fix_groups.sql` and `007a_emergency_drop_group_rls.sql`. |
| `drop: command not found` in Terminal | SQL belongs in **Supabase → SQL Editor**, not your Mac shell. |

## 3. Auth settings in Supabase

**Authentication → URL configuration**

- **Site URL** (production): `https://www.jointavro.app`
- **Site URL** (local): the origin you actually open, such as `http://127.0.0.1:43123`
- Redirect URLs (add **all** you use):
  - `https://www.jointavro.app/**`
  - `https://jointavro.app/**`
  - `http://localhost:3000/**`
  - `http://127.0.0.1:3000/**`
  - `http://localhost:3456/**`
  - `http://127.0.0.1:3456/**`
  - `http://127.0.0.1:43123/**`
  - `http://localhost:43123/**`

`jointavro.app` links are sent to `https://www.jointavro.app` so the confirmation cookie lands on the canonical host.

**Authentication → Providers → Email**

- Turn **on** **Confirm email**. New accounts stay signed out until they open the link.

**Authentication → Bot and Abuse Protection**

- Enable Cloudflare Turnstile with the same secret as `TURNSTILE_SECRET_KEY`.
- The app also checks the token on the server before calling sign-up. Direct Auth API calls are rejected only after this Supabase captcha setting is on.

**Authentication → Rate limits**

- Supabase still limits how many emails it will send. The app adds its own limits (sign-up 5 per IP per hour, login 20 per IP and 10 per email per 15 minutes, resend / re-verify / password reset 3 per email per hour) after migration 052.

**Passwords**

- New passwords are 8 to 72 characters. There is no composition rule. Existing passwords keep working at login.

## 4. How sign-up works in the app

1. The server checks Turnstile and the sign-up rate limit.
2. `supabase.auth.signUp` creates an **unconfirmed** user and Supabase sends the confirmation email.
3. The person lands on **Check your email** and can resend.
4. Opening the link hits `/auth/callback`, which exchanges the code and, with the service role, sets `profiles.email_ownership_verified_at`.
5. Profile creation does **not** mark the email verified. Admin account creation is not used for normal sign-up.

Until the link is opened, protected Tavro screens and actions stay closed. Browsing while signed out still works.

### Existing accounts

Migration 052 adds `email_ownership_verified_at` as null for every current profile. It does not delete users, sessions, challenges, or progress, and it does not clear `email_confirmed_at`.

Accounts created with the old automatic confirmation have a confirmed flag without proof they own the inbox. After 052 is applied and the service role key is set, the next visit to a protected page asks them to open a one-time link. The same account comes back. Admins need to do this once too.

Do not bulk-unconfirm or delete those users.

### Creator access

Member registration does not grant Creator Studio. Organic creators still complete social verification and admin approval. Invited creators still use the single-use invite, and acceptance now requires the proven inbox.

### Forgot password (self-serve)

1. On **Log in**, tap **Forgot password?** (or open `/forgot-password`).
2. Enter your email — Supabase sends a reset link (same redirect rules as sign-up).
3. Open the link on the **same device/browser** you use for Tavro; you land on **Reset password** to set a new one.

Redirect URLs must include `https://www.jointavro.app/**` so the link can return through `/auth/callback`. Opening the reset link also records inbox ownership.

## 5. Verify

```bash
npm run check:auth
```

## Troubleshooting

| Error | Fix |
|--------|-----|
| Database error saving new user | Run migration **003** |
| Email rate limit exceeded | Wait about an hour. Keep **Confirm email** on. App resend is limited to 3 per address per hour, and Supabase has its own cap. |
| Invalid login credentials | Sign up first, use **Forgot password?** on log in, or reset in **Authentication → Users** |
| User already registered | Use **Log in** |
| Groups create/join fails (RLS) | Run migrations **006** then **`007_one_shot_fix_groups.sql`** (see step 7 above) |
| **Log in doesn’t work** / invalid credentials | Same email must exist under **Authentication → Users** for **this** project. Confirm the email first, or use **Forgot password?** Check `.env.local` URL/key match that project. Run `npm run check:auth`. After changing `.env.local`, restart `npm run dev`. |
| Log in spins then nothing | Restart dev server; use **http://127.0.0.1:3456** (same port as terminal). Clear site cookies for localhost. |
| **Works on Mac, not on phone** | Supabase → **URL configuration**: Site URL = `https://www.jointavro.app`; add `https://www.jointavro.app/**` and `https://jointavro.app/**` under Redirect URLs. Vercel → **Environment Variables**: Supabase URL, anon key, service role, and both Turnstile keys on Production. |
