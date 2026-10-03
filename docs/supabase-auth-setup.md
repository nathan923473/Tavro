# Supabase auth (sign-up & login)

## Required env (`.env.local` only)

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key
```

In Supabase → **Authentication → URL configuration**:

- **Site URL:** `http://localhost:3000` (or your deployed URL)
- **Redirect URLs:** `http://localhost:3000/**`

For local dev without email confirmation: **Authentication → Providers → Email** → turn off **Confirm email**.

### “Email rate limit exceeded” (sign-up keeps failing)

Supabase limits how many auth emails can be sent. **Using another email does not bypass this.**

1. **Authentication → Providers → Email** → disable **Confirm email** → Save.
2. **Authentication → Rate limits** → increase limits if you are testing heavily, or wait about an hour.
3. **Fastest way to log in today:** **Authentication → Users → Add user** → enter your email and password → turn on **Auto confirm user** → Create. Then in Streakly use **Log in** (not Sign up) with that email.

## SQL migrations (run in order)

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_member_creator_accounts.sql`
3. `supabase/migrations/003_fix_signup_profile_trigger.sql` — **required if sign-up shows “Database error saving new user”**

## Verify from the project folder

```bash
npm run check:auth
```

You should see `✓ Sign-up works`. If not, run migration **003** in the SQL Editor and try again.

## What was wrong

Hosted Supabase installs `pgcrypto` in the `extensions` schema. The original profile trigger called `gen_random_bytes()` with `search_path = public` only, so new users failed during the auth sign-up trigger and login appeared “broken” because no account was ever created.
