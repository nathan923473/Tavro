# Supabase auth — normal sign-up & log in

## 1. Keys in `.env.local` (project folder, never commit)

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key

# Recommended: enables sign-up without confirmation emails (server-only, never public)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret
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

### Groups SQL mistakes

| Error | Fix |
|--------|-----|
| `policy "Group messages readable by members" already exists` (42710) | You ran **CREATE** before **DROP** (often from a partial paste). Run `007a_emergency_drop_group_rls.sql`, then the full `007_one_shot_fix_groups.sql`. |
| `infinite recursion detected in policy for relation "accountability_groups"` | Run **`008_fix_group_rls_row_security.sql`** (after 007). Pull latest app code so create group does not rely on `insert().select()`. |
| `cannot change name of input parameter "gid"` | Drop old functions first — included at the top of `007_one_shot_fix_groups.sql` and `007a_emergency_drop_group_rls.sql`. |
| `drop: command not found` in Terminal | SQL belongs in **Supabase → SQL Editor**, not your Mac shell. |

## 3. Auth settings in Supabase

**Authentication → URL configuration**

- Site URL: `http://localhost:3000` (and your preview URL if you use Cloudflare tunnel)
- Redirect URLs: `http://localhost:3000/**`, `https://*.trycloudflare.com/**`

**Authentication → Providers → Email**

- Turn **off** **Confirm email** while developing (instant log in after sign-up)

**Authentication → Rate limits** (if you hit limits)

- Raise limits or wait ~1 hour

**Authentication → Password security** (optional while testing)

- You can turn off **Leaked password protection** temporarily if Chrome/Supabase blocks a test password

## 4. How sign-up works in the app

| Setup | Sign-up behavior |
|--------|------------------|
| **Service role key** in `.env.local` | App creates a **confirmed** user (no email) → logs you in |
| **Anon key only** | Standard Supabase sign-up (needs steps 2–3 above) |

Log in always uses your email + password on the **Log in** page.

## 5. Verify

```bash
npm run check:auth
```

## Troubleshooting

| Error | Fix |
|--------|-----|
| Database error saving new user | Run migration **003** |
| Email rate limit exceeded | Add **service role** key, or disable confirm email + wait |
| Invalid login credentials | Sign up first, or reset password in **Authentication → Users** |
| User already registered | Use **Log in** |
| Groups create/join fails (RLS) | Run migrations **006** then **`007_one_shot_fix_groups.sql`** (see step 7 above) |
