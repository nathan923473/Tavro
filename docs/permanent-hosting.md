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
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-only; needed for sign-up flow) |

Redeploy after adding variables.

### Supabase auth URLs

In Supabase → **Authentication → URL configuration**:

- **Site URL:** `https://your-project.vercel.app`
- **Redirect URLs:** `https://your-project.vercel.app/**`

## Run on your Mac (stable for you only)

```bash
npm run dev
```

Open **http://127.0.0.1:3000** on the **same Mac**. Not public on the internet unless you deploy or use your own tunnel.

## Custom domain (later)

Connect a domain in Vercel after Publish, then update Supabase Site URL / redirects to match.
