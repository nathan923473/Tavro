# Tavro design system

Apple Fitness–inspired clarity: calm surfaces, one primary action per screen, subtle depth. Brand colours are fixed; do not introduce new hues.

## Colour (CSS variables — `src/app/globals.css`)

| Token | Role |
|--------|------|
| `--primary` / `primary` | Primary actions, links, focus ring |
| `--primary-dark` | Hover / pressed primary |
| `--foreground` | Headings and body (navy) |
| `--muted-foreground` | Secondary text |
| `--surface` | Cards and elevated panels |
| `--background` | App canvas |
| `--secondary` / `--accent` | Mint-tinted success and highlights |
| `--border` | Dividers and outlines |

Use utilities: `text-brand`, `bg-brand-subtle`, `bg-mint-subtle`. Avoid hardcoded `#3156E8`, `#1B2440`, `#B8F4DA` in components.

## Typography (Inter)

| Class | Use |
|--------|-----|
| `text-display` | Rare marketing hero |
| `text-title-lg` | Page titles (Home, Progress) |
| `text-title` | Section titles |
| `text-body` | Default body |
| `text-caption` | Meta, dates, hints |

## Spacing

| Class | Use |
|--------|-----|
| `page-stack` | Vertical rhythm between major sections (`space-y-6`) |
| `section-stack` | Inside a section (`space-y-3`) |

## Radius & elevation

- Cards and primary buttons: `rounded-2xl`
- Chips, inputs, small controls: `rounded-xl`
- Shadow: `shadow-card` only; avoid ad-hoc shadows

## Components (`src/components/ui/`)

- `Button`, `PrimaryLink`, `SecondaryLink` — actions
- `Card` variants: `default`, `muted`, `brand`, `outline`
- `SectionHeader` — section title + description
- `MutedCallout` — short privacy / hint text
- `MoodPicker` — shared daily mood control
- `ProgressRing` — circular daily/weekly completion indicator
- `EmptyState` — centred empty views with optional action

## Surfaces

| Class | Use |
|--------|-----|
| `surface-hero` | Primary branded hero (Home welcome, profile header) |
| `surface-soft` | Secondary panels with light blur |
| `surface-inset` | Recessed empty states |
| `page-stack-compact` | Tighter vertical rhythm on Home |

## Motion

- Page enter: `animate-fade-up`
- Success: `animate-success-pulse` (respects `prefers-reduced-motion`)
- Keep animations CSS-only for performance

## Touch & accessibility

- Minimum interactive height: 44px (`min-h-11`)
- Visible focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
