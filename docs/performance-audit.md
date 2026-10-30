# Performance audit & improvements

Measured with production `npm run build --webpack` and `node scripts/measure-build.mjs`.

## Baseline findings (before)

| Area | Issue |
|------|--------|
| **Challenges / Discover / Progress** | `fetchChallengesForUser` loaded **every public challenge** + gallery for all IDs on several pages. |
| **Challenges tab** | **N+1** `fetchChallengeMessages` per joined challenge (sequential). |
| **Home** | Extra Supabase round-trip for `timezone` (duplicate of profile). |
| **Discover lists** | Uncached repeated queries on every navigation. |
| **Images** | Challenge covers used `unoptimized` (full-size downloads on mobile). |
| **JS** | Large shared chunks; lucide barrel imports without package optimization. |
| **Auth** | Middleware `getUser()` on each navigation (required for Supabase SSR refresh). |
| **Layout** | Notification count blocked in same tick as shell (minor). |

## Changes implemented

1. **`fetchJoinedChallengesForMember`** / **`fetchJoinedChallengeIds`** — only joined rows + gallery for card UI.
2. **`fetchChallengeMessagesForChallenges`** — single batched message query.
3. **`fetchDiscoverSectionsCached`** — 120s revalidate, public data only (no PII).
4. **Profile `timezone`** in `getCurrentUserProfile` — removed Home duplicate query.
5. **`optimizePackageImports: ['lucide-react']`** in `next.config.ts`.
6. **Challenge cover** — Next.js Image optimization (removed `unoptimized`).
7. **Challenge hub** — dynamic import of participant hub + route `loading.tsx`; parallel server fetches.
8. **Notification bell** — `Suspense` boundary for streaming.

## Security / caching

- Discover cache: **published public challenges only** — no user records.
- No caching of habits, groups, messages, or profile data.

## How to re-measure

```bash
npm run build
node scripts/measure-build.mjs > docs/performance-after.json
```

Compare `clientChunksBytes` and top chunk sizes. For real-world TTFB/LCP, use Vercel Speed Insights or Chrome Lighthouse on production with auth.

## Measured bundle (this run)

| Metric | Before | After | Notes |
|--------|--------|-------|--------|
| Client `static/chunks` | **2.05 MB** | **2.06 MB** | ~flat — wins are mostly **server/data**, not JS removal |
| Server `server/app` | **3.67 MB** | **3.71 MB** | ~flat — new loading route + cache helper |

**Expected runtime gains (not captured by bundle size):**

- **Challenges page:** O(all public challenges) → O(joined only); messages **N queries → 1**.
- **Discover page:** no full challenge table fetch; joined IDs only.
- **Progress page:** joined challenges only (same as Home).
- **Repeat visits:** discover sections cached 120s at the edge/server.
- **Mobile covers:** smaller image payloads via Next Image optimizer.
- **Challenge hub navigation:** separate JS chunk loads after route transition (`dynamic()` + `loading.tsx`).

Commit: **`6fca80b`** on Cloud Agent `main`.

### Follow-up (continued execution)

- **Challenges page:** challenge group chat messages load **on the client** per card (`loadChallengeMessagesAction`) — server no longer waits on batched message query before paint.
- **Progress / Groups:** route-level **`loading.tsx`** skeletons for faster perceived navigation.
