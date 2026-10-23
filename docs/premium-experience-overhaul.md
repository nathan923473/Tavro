# Premium product experience overhaul

Follow-on to `docs/premium-ui-rollout.md` (P0–P9 tokens and consistency).

## Goals

- Product-led UX (Home narrative, challenge spotlight, progress dashboard) — not only component polish.
- Apple Fitness–inspired clarity without copying Apple branding.
- Real data only; no fabricated stats or achievements.

## Phase map (implemented)

| Phase | Focus |
|-------|--------|
| 1 | Design surfaces: `surface-hero`, `surface-inset`, `surface-soft`, `ProgressRing`, `EmptyState`, `page-stack-compact` |
| 2 | **Home:** `HomeHero` (personalised + daily ring), `HomeChallengeSpotlight`, Creator Studio icon in header, compact stack |
| 3 | **Challenges:** richer cards/landing cover ratios, hub title scale, activity focus targets |
| 4 | **Progress:** `ProgressDashboardHero` + weekly rhythm copy |
| 5 | **Groups:** `GroupOverviewHeader` on hub |
| 6 | **Studio:** brand status card variant |
| 7 | **Profile:** `ProfileHeroCard` |
| 8 | Interactions: existing success pulse + focus rings extended where touched |

## Key files

- `src/lib/home/today-progress.ts` — unified daily completion %
- `src/components/dashboard/home-hero.tsx`
- `src/components/dashboard/home-challenge-spotlight.tsx`
- `src/components/ui/progress-ring.tsx`
- `src/components/progress/progress-dashboard-hero.tsx`
- `src/components/groups/group-overview-header.tsx`
- `src/components/profile/profile-hero-card.tsx`

## QA

- `npm run build` with Supabase env vars
- Mobile: Home hero + spotlight + bottom nav; group hub header; join landing cover
- Journeys unchanged functionally — join, hub tabs, commitments vs habits, Studio CRUD

## Ship

Merge Cloud Agent `main` to `nathan923473/Tavro` for Vercel (see premium-ui-rollout deploy note).
