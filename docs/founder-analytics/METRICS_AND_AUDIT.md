# Founder analytics — audit, definitions, and limitations

Last updated with migration `023_founder_analytics.sql`.

## Phase 1 audit summary

### Existing data (no new tracking required)

| Metric | Accuracy | Source |
|--------|----------|--------|
| Creator repeat challenge rate (M11) | **High** for published challenges | `challenges` where `publish_status = 'published'`, `created_by` |
| Cross-creator participation (M13) | **High** | `challenge_participants` + `challenges.created_by` |
| Community engagement partial (M14) | **Medium** | `challenge_schedule_completions`, `goal_completions`, `community_follows` — no post-level feed yet |
| Creator audience growth partial (M15) | **Medium** | `community_follows.created_at` per `community_id` |
| Challenge completion proxy (M9) | **Medium** | `challenge_participants.progress_percent` ≥ threshold (default 80%) — not schedule-day coverage |
| Repeat challenge participation (M10) | **High** for join counts | `challenge_participants` per `user_id` |
| DAU/MAU (M8) | **Medium** (from tracking start) | Meaningful activity union after events exist; historical from DB activity tables |
| Day 7 / 30 retention (M6–7) | **Medium** | Cohorts from `profiles.created_at` + meaningful activity tables |
| Revenue (M16–19) | **N/A** | No billing tables — dashboard shows unavailable |
| CAC (M20) | **Partial** | Manual `founder_acquisition_expenses` when entered |

### Requires new tracking (added in 023+)

| Metric | Notes |
|--------|--------|
| New users per creator (M1) | `profiles.attributed_creator_id` at signup (first-touch), not “all joins” |
| Participant referral rate (M2) | `profiles.referrer_user_id` + successful signup |
| Viral coefficient (M3) | `referral_link_opened` + signups; K-factor only if invitation denominator reliable — else “referrals per eligible user” |
| Signup conversion (M4) | `challenge_page_viewed` (deduped) vs `user_signed_up` with challenge attribution |
| Organic acquisition % (M5) | `signup_acquisition_source` — **unknown** not counted as organic |
| Creator retention (M12) | `platform_analytics_events` for creator actions + published challenges |

### Cannot measure reliably yet (honest gaps)

- **Landing page views before migration 023** — not stored historically.
- **Participant referrals before attribution columns** — existing users show as `unknown` unless manually fixed.
- **K-factor with full invitation funnel** — share actions without server events under-count invitations; dashboard uses conservative alternative when K is not valid.
- **Organic search vs direct** — no search console integration; stays `unknown` or `direct` unless UTM params are present on signup URLs.
- **MRR / GRR / NRR / paid creator conversion** — no subscription product.

## Attribution rules (first-touch, immutable)

1. **Signup attribution** is written once when the account is created (or first `applySignupAttribution` within 24h of signup if client-only signup).
2. Fields on `profiles`: `signup_acquisition_source`, `referrer_user_id`, `attributed_creator_id`, `attributed_challenge_id`, `attribution_metadata` (utm, landing path).
3. Joining additional challenges **does not** overwrite signup attribution.
4. **Creator-attributed new user**: `profiles.created_at` in range AND `attributed_creator_id` set AND user had no prior profile row (new registration).
5. **Existing user joining a challenge** is tracked on `challenge_participants.is_new_platform_user_at_join = false`, not counted in creator acquisition signups.

## Meaningful activity (retention & DAU)

Counts once per user per UTC calendar day if any of:

- `goal_completions` row created
- `challenge_schedule_completions` row created
- `challenge_daily_check_ins` row created
- `platform_analytics_events` type `habit_completed`, `challenge_activity_completed`, `challenge_joined` (same day)

Does **not** count: notification delivery, passive page loads, middleware session refresh.

## Challenge completion (M9)

Participant **completed** when `progress_percent >= FOUNDER_CHALLENGE_COMPLETION_PERCENT` (default 80). Eligible when joined and challenge `end_at` (or `end_date`) is in the past OR challenge status completed — participant still enrolled. End date alone does not auto-complete.

## Exclusions

- `profiles.is_test_account = true` excluded from all founder metrics.
- Platform admins (`is_admin`) excluded from participant/creator growth denominators unless explicitly included in debug mode (not exposed in UI).

## Tracking start

Dashboard shows `analyticsTrackingStartedAt` = earliest of migration deploy note, min(`platform_analytics_events.occurred_at`), min attributed signup with non-null source.
