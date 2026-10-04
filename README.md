# Streakly

Mobile-first Progressive Web App for sustainable weight-loss accountability: personal goals, optional small groups, and creator challenges.

**Current phase:** Supabase-backed member + creator features (no localStorage demo mode). Run migration **006** for goals, groups, messaging, and weigh-ins.

**Launch business model:** The app is **100% free** for users and fitness creators — no subscriptions, payments, or paid challenges yet. Growth is **creator-led** (challenge invite links) and **referral-led** (member invite links). Messaging emphasizes sustainable habits and encouragement, not competitive weight loss.

## Architecture (MVP → production)

```
src/
  app/
    (app)/          # Main tabs: Home, Groups, Challenges, Progress, Profile
    offline/        # Service worker offline fallback
    manifest.ts     # Web app manifest (Next.js)
  components/       # UI + layout + dashboard sections
  lib/
    mock-data.ts    # Demo content (replace with Supabase queries)
    push-notifications.ts  # Opt-in push stub for later
  types/            # Shared domain types (API-ready for future mobile apps)
```

**Backend-ready design:** Domain types and route boundaries are separated so a future React Native or Capacitor app can call the same Supabase APIs without rewriting business logic.

**Cloudflare deployment:** Built as a standard Next.js app. For Cloudflare Pages, use [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) or export/static hosting for marketing pages; configure `NEXT_PUBLIC_*` env vars in the Cloudflare dashboard. PWA assets live in `public/` and are emitted at build time.

## Run locally (your laptop — recommended)

**Requirements:** [Node.js](https://nodejs.org) 20+.

Clone **`nathan-stone/stride`** from Origin (see **`LAPTOP.md`**) or open this repo in Cursor, then:

```bash
node scripts/laptop-setup.mjs   # once
npm run dev                     # every session
```

Open **http://127.0.0.1:3000** in Chrome on the **same machine**. This does not expire like Cloud Agent preview links.

Full steps: **`LAPTOP.md`**

**Production-like local host** (installable PWA + service worker):

```bash
npm run build
npm run start
```

Then open [http://localhost:3000](http://localhost:3000) again.

Optional — copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

So “Copy invite link” buttons use your local URL while testing.

### Localhost not working?

1. **Cursor cloud vs your PC** — `localhost` in Chrome on your laptop only works if **you** ran `npm run dev` in a **cloned copy** of the repo on that same laptop. The agent’s Preview is separate; your home `localhost` is not the cloud server.

2. **Check setup:**
   ```bash
   npm run doctor
   ```

3. **Port 3000 busy** (common error: `EADDRINUSE`):
   ```bash
   npm run dev:alt
   ```
   Open **http://localhost:3456**

4. **Turbopack issues** — try:
   ```bash
   npm run dev:webpack
   ```

5. Leave the terminal **open** while the app runs. Closing it stops the server.

## Install as PWA

### iPhone (Safari)

1. Open the app in **Safari** (installation from Chrome on iOS is limited).
2. Tap **Share** → **Add to Home Screen**.
3. Launch **Streakly** from your home screen for standalone mode.

### Android (Chrome)

1. Open the app in Chrome.
2. When prompted, tap **Install app**, or use the menu → **Install app** / **Add to Home screen**.

You can also use **Profile → Install the app** for platform-specific hints.

## Environment variables (next phase)

Copy `.env.example` to `.env.local` when you connect Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (optional, for push later)

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run dev`  | Development server                   |
| `npm run build`| Production build + service worker    |
| `npm run icons`| Regenerate PNG app icons             |

## What you need to do manually (Supabase — not wired yet)

1. Create a free [Supabase](https://supabase.com) project.
2. Enable Email auth and configure redirect URLs for your domain.
3. Add Row Level Security policies for profiles, goals, groups, and messages.
4. Paste project URL and anon key into `.env.local`.

We will connect these in the next development step.
