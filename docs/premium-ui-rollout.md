# Premium UI rollout (P0–P9)

Completed in Cloud Agent branch `main` (after `c24486c` hub access fixes).

## Foundation (P0)

- `docs/design-system.md` — tokens, typography, spacing, motion, a11y
- `globals.css` — `page-stack`, `section-stack`, `text-title*`, `focus-ring`, `animate-success-pulse`, reduced-motion
- UI primitives: `SectionHeader`, `MutedCallout`, `MoodPicker`, `TabPills`, `Skeleton` / `PageSkeleton`, `PrimaryLink` / `SecondaryLink`
- `Button` / `Card` variants aligned with design system

## Chrome (P1)

- Member `PageHeader`, `bottom-nav`, Studio `studio-layout` + `studio-nav` — sticky blurred headers, consistent title scale

## Consistency (P2)

- Broad migration from hardcoded Tavro hex to Tailwind tokens (`primary`, `foreground`, `mint-subtle`, etc.)
- Charts use `var(--primary)` where applicable
- Key CTAs use link-button primitives on Challenges and Studio list pages

## Member surfaces (P3–P6)

- Home: `page-stack`, daily summary/check-in tokens, `TodaysGoals` / habits with success pulse + 44px targets
- Challenges: discover page spacing, muted launch callout
- Participant hub: `TabPills`, shared `MoodPicker`, sticky tab bar while scrolling
- Progress: `SectionHeader`, private-space callout
- Groups: tab pills, calmer commitment / habit link labels

## Creator Studio (P7)

- Overview and challenge list use `SectionHeader`, muted metric cards, primary/secondary links

## Motion & loading (P8)

- App route loading skeleton; habit completion success pulse on Home

## A11y & QA (P9)

- Focus rings on primary toggles and nav; tab roles on pill bars
- Remaining optional polish: migrate every raw `<Link>` CTA, challenge activity row pulse, full E2E with Supabase credentials

## Deploy sync

Production (`nathan923473/Tavro` → Vercel) is a separate remote from Cursor Cloud Agent. Merge or push commits from this repo to GitHub before expecting Vercel to update.

## Local build

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (see `.env.example`) before `npm run build`.
