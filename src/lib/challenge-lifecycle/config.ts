/** Creator challenge caps — adjust here rather than scattering magic numbers. */
export const CREATOR_CHALLENGE_LIMITS = {
  maxDraft: Number.POSITIVE_INFINITY,
  maxUpcomingPublished: 3,
  maxActivePublished: 1,
  maxCompleted: Number.POSITIVE_INFINITY,
} as const;

/** Soft recommendation shown in Studio when publishing early. */
export const RECOMMENDED_REGISTRATION_OPEN_DAYS_BEFORE_START = 14;

/** Studio nudge when active challenge ends within this many days. */
export const NEXT_CHALLENGE_PROMPT_DAYS_BEFORE_END = 7;
