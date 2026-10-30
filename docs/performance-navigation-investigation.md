# Navigation performance investigation (Oct 2026)

## What you measured (production, authenticated)

Chrome DevTools **Network** on [jointavro.app](https://www.jointavro.app) showed slow **Next.js RSC** fetches (~1.3–4.8 KB, HTTP 200):

| Route | RSC time (reported) |
|-------|---------------------|
| Home `/` | **9.96 s** |
| Main document | **8.91 s** |
| Groups | **8.75 s** |
| Profile | **4.60 s** |
| Progress | **2.69 s** |
| Challenges | **~2.3–2.5 s** |

Payload sizes are tiny → delay is almost entirely **server time (TTFB)**, not download or client JS parsing.

## Control measurement (unauthenticated, same host)

From Cloud Agent (Oct 31 2026, Melbourne), `curl` with `RSC: 1`:

| Route | Document | RSC |
|-------|----------|-----|
| `/` | 0.11 s | **0.07 s** |
| `/groups` | 0.07 s | **0.06 s** |
| `/challenges` | 1.02 s | **0.05 s** |
| `/progress` | 0.06 s | **0.06 s** |
| `/profile` | 0.06 s | **0.07 s** |

**Conclusion:** The edge can respond quickly for **guest** RSC. Logged-in navigation pays for **auth validation + Supabase data** on every soft nav, not general network slowness to Vercel.

## Architecture (what runs on each tab navigation)

1. **Middleware** (`middleware.ts` → `updateSession`) on almost all paths.
   - When JWT is comfortably valid: **skips** Supabase Auth network (`middlewareShouldRefreshSession`).
   - When near expiry: **`auth.getUser()`** to refresh cookies (extra Auth API RTT, sometimes twice for tab vs default cookie keys).

2. **App layout** (`src/app/(app)/layout.tsx`): sync shell + **`NotificationBellSlot`** (Suspense). Previously blocked on unread count query; now badge loads client-side after paint.

3. **Each tab page** (all `dynamic` server components):
   - **`getCurrentUserProfile()`** — `react` `cache()` dedupes within one request, but still **`auth.getUser()` + profiles row** per navigation (Auth API + DB).
   - Then route-specific Supabase work (see below).

## Per-route bottlenecks (code, not guesses)

### Home `/`

- `Promise.all`: dashboard bundle, joined challenges, group hub, member prefs (good).
- **Then sequential:** `fetchChallengeParticipantHub` — large join (schedule, members, activities, announcements). Often the **longest single call** on Home.
- **Groups data** via `fetchUserGroup` can loop `loadGroupHub` (multiple round-trips if candidate group IDs).

### Groups `/`

- `Promise.all`: group state, habits, discovery eligibility (**fixed:** eligibility was sequential before).
- **Then conditional:** `fetchDiscoverableGroups` RPC when eligible (extra RTT).

### Challenges `/`

- `fetchDiscoverSections` — **two** heavy selects (public challenges + communities). Was uncached after `unstable_cache` removal (Vercel crash fix); ran through cookie-bound SSR client.
- Joined challenges + member prefs in parallel (good).

### Progress `/`

- **Nine** parallel member/challenge queries — good concurrency, but **high total DB work** per visit.

### Profile `/`

- Had **duplicate** `profiles` read for timezone/AU state after `getCurrentUserProfile` (**fixed:** fields merged into profile fetch).

### Shared layout

- Unread notifications count on server (**fixed:** client fetch after mount; RSC shell no longer waits on count).

## Likely contributors to ~8–10 s spikes (same order of magnitude on several tabs)

1. **Serverless cold start** — first request after idle on Vercel Node runtime; similar baseline across routes matches this pattern.
2. **Supabase Auth `getUser()`** per navigation (middleware when refreshing + every page via `getCurrentUserProfile`).
3. **Region latency** — browser in AU → Vercel function region → Supabase project region; each hop adds RTT on **every** query.
4. **Heavy routes** — Home hub + group hub + uncached discover (Challenges).

Not the primary cause: client bundle size (RSC payloads ~1–5 KB), or slow static asset CDN.

## Vercel function logs

This agent run **does not have access** to your Vercel team logs. After deploy, in Vercel → Project → Logs, filter **RSC** requests and check:

- **Duration** vs **Cold Start**
- Repeat the same tab within 2 minutes — if second nav is &lt;1 s, cold start dominated.

Align **Vercel serverless region** with **Supabase region** (Project Settings → Infrastructure).

## Changes in this pass (targeted)

| Change | Effect |
|--------|--------|
| Public read client + **`unstable_cache` 120s** on discover sections | Challenges/Discover repeat nav avoids 2× DB + cookie SSR on hot path; safe (no PII). |
| Parallel challenge + community discover queries | −1 sequential RTT on cache miss. |
| Profile timezone/AU in **`getCurrentUserProfile`** | −1 profiles query on Profile nav. |
| Groups discovery eligibility in **`Promise.all`** | −1 sequential RTT when loading groups. |
| Notification badge **client-side** after shell | RSC stream not blocked on unread count. |

Preserved: auth security (`getUser` on server), all features, no caching of user habits/groups/messages.

## Re-measure after deploy

With `.env.local` (demo user):

```bash
npm run build && npm run start -- -p 3457
node scripts/measure-soft-nav.mjs http://127.0.0.1:3457
node scripts/measure-nav.mjs http://127.0.0.1:3457
```

On production (logged in): DevTools → Network → filter **`_rsc`** or fetch type **fetch** → compare **Waiting (TTFB)** before/after deploy on the **second** navigation (warm function).

## Why earlier optimisations did not make navigation feel instant

`loading.tsx`, `Suspense`, `staleTimes`, and smaller queries only help **after the server starts responding**. Logged-in RSC still waited on middleware, auth, and Supabase before the new screen could paint. A 2–10s function (cold start or database RTT) meant a 2–10s frozen tab. Skeletons never appeared until that response began.

## Instant tab shell (this change)

Bottom nav calls `flushSync` and paints either the **last ready screen** for that tab or the **destination header + skeleton** in the same frame. The RSC request continues in a hidden tree. When real content mounts (`TabReady`), it replaces the shell. The cache is **in-memory in that browser tab only** and is cleared on `/login` and sign-out. It is not a shared CDN cache, so one member’s habits cannot be served to another.

Check-in shows **Saving…** immediately, **saved** only after the server action resolves, and an error with retry if it fails.

## Deploy status

Commits land on **Cursor origin `main`**. Production [jointavro.app](https://www.jointavro.app) updates when **`nathan923473/Tavro`** on GitHub receives a push and Vercel finishes deploy — confirm commit on Vercel **Production** dashboard after your merge/push.
