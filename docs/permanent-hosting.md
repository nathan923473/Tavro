# Permanent hosting (not temporary preview links)

## Why `trycloudflare.com` links stop working

Links from the Cloud Agent (`*.trycloudflare.com`) are **temporary tunnels**. They die when:

- The agent session ends or sleeps
- The dev server stops
- The tunnel process restarts

There is **no way to keep the same random trycloudflare URL forever** from the agent alone.

## Permanent option: Publish to Vercel (recommended)

In this Cursor project chat, use the **Publish** button (connect Vercel if prompted).

You get a stable URL like:

`https://your-project.vercel.app`

### After Publish — required Vercel env vars

In Vercel → Project → **Settings → Environment Variables**, add:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-only). Records email ownership after a confirmation link. It must not create confirmed users for normal sign-up. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Turnstile secret (server-only) |

Redeploy after adding variables.

### Supabase auth URLs

In Supabase → **Authentication → URL configuration**:

- **Site URL:** `https://www.jointavro.app`
- **Redirect URLs:** `https://www.jointavro.app/**` and `https://jointavro.app/**`
- Authentication → Providers → Email → **Confirm email** on
- Authentication → Bot and Abuse Protection → Cloudflare Turnstile, using the same secret as `TURNSTILE_SECRET_KEY`

## Run on your Mac (stable for you only)

```bash
npm run dev
```

Open **http://127.0.0.1:3000** on the **same Mac**. Not public on the internet unless you deploy or use your own tunnel.

## Custom domain (later)

Connect a domain in Vercel after Publish, then update Supabase Site URL / redirects to match.
