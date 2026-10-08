/** Minimum progress_percent to count as challenge completed (founder metric M9). */
export const FOUNDER_CHALLENGE_COMPLETION_PERCENT = 80;

/** Attribution window: landing view within N days before signup counts for conversion. */
export const SIGNUP_ATTRIBUTION_WINDOW_DAYS = 7;

export const ANALYTICS_ATTR_COOKIE = "streakly_attr_v1";
export const ANALYTICS_VISITOR_COOKIE = "streakly_vid";

export type SignupAcquisitionSource =
  | "creator_link"
  | "participant_referral"
  | "direct"
  | "organic_search"
  | "paid"
  | "unknown";

export const ORGANIC_ACQUISITION_SOURCES: SignupAcquisitionSource[] = [
  "creator_link",
  "participant_referral",
  "direct",
  "organic_search",
];
