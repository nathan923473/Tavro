# Merge GitHub `main` + `cursor-origin/main` (keep both)

Use this when GitHub has **premium Home** (`ff74fa1`) and **tab streaming** (`be9d2c2`, `c34cbc8`) while **cursor-origin/main** has **perf** and the **Challenges server fix** (`a188ee2`).

## Recommended flow

1. **Branch → Merge into `main` → `cursor-origin/main`** (or merge cursor-origin into your GitHub clone).
2. If GitHub is ahead with streaming work, merge **`github/main`** into the result (or merge both remotes in either order and resolve once).

Cloud Agent **`main`** after the combined merge commit includes:

| Source | What you keep |
|--------|----------------|
| GitHub | Premium Home UI, `RouteFallback` / `Suspense` on tabs, `NotificationBellSlot`, `staleTimes` + `optimizePackageImports` in `next.config.ts`, sequential challenge hub access (no `revalidatePath` during render), middleware JWT skip when token is fresh |
| cursor-origin | Scoped challenge/discover fetches, dynamic hub import, **`discover-cached.ts` without `unstable_cache`**, profile/discover fallbacks from `a188ee2` |

## Conflict cheat sheet (12 files)

When GitHub Desktop asks you to pick sides, **combine** — do not blindly take one branch for all of `src/`:

| File | Resolution |
|------|------------|
| `src/lib/data/discover-cached.ts` | **cursor-origin** — plain `fetchDiscoverSections()`, no `unstable_cache` |
| `next.config.ts` | **Both** — single `experimental` block with `optimizePackageImports` + `staleTimes` |
| `src/app/(app)/page.tsx` | **Both** — premium Home content + `RouteFallback` / `challengePhaseFromChallenge` |
| `src/app/(app)/layout.tsx` | **GitHub** — `NotificationBellSlot` |
| `src/app/(app)/loading.tsx` | **GitHub** — `AppSegmentLoading` |
| `src/app/(app)/challenges/page.tsx` | **Both** — perf data fetches + `Suspense` shell |
| `src/app/(app)/challenges/[id]/page.tsx` | **Both** — dynamic hub import + **sequential** access then hub fetch |
| `src/app/(app)/member/actions.ts` | **GitHub** — omit `revalidatePath` in hub access action |
| `src/lib/supabase/middleware.ts` | **GitHub** — `middlewareShouldRefreshSession` early return |
| `src/app/(app)/profile/page.tsx` | **GitHub** — parallel `Promise.all` for goals/prefs |
| `src/app/join/[slug]/page.tsx`, creator public challenge page | **GitHub** — `challengePhaseFromChallenge` + redirect rules |
| `src/components/dashboard/home-challenges-section.tsx` | **GitHub** — `challengePhaseFromChallenge` |
| `package-lock.json` | Accept either, then `npm install` |

## Terminal (after merge stops with conflicts)

Only if you intentionally want **all of cursor-origin `src/`** (loses GitHub streaming unless already on cursor-origin):

```bash
git checkout --theirs -- src/lib/data/discover-cached.ts   # if merging cursor-origin INTO main
# …then manually fix layout, loading, middleware, next.config per table above
npm install && npm run build
git add -A
git commit -m "Merge: premium Home + perf + Challenges fix"
git push origin main
```

## Verify

- **Home**: title “Today”, hero, spotlight, progress ring  
- **Challenges**: `/challenges` loads (no server error)  
- **Vercel**: production commit is merge + includes discover fix (no `unstable_cache` on discover)

After **merge + push** to `nathan923473/Tavro`, Vercel updates once; no extra sync until new Cloud Agent commits land.
