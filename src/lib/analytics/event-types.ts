export const PLATFORM_EVENT_TYPES = [
  "user_signed_up",
  "challenge_page_viewed",
  "challenge_joined",
  "challenge_left",
  "referral_link_opened",
  "invitation_shared",
  "challenge_activity_completed",
  "habit_completed",
  "creator_followed",
  "creator_approved",
  "creator_invitation_accepted",
  "creator_application_submitted",
  "challenge_created",
  "challenge_published",
  "challenge_shared",
  "creator_first_participant_joined",
  "challenge_started",
  "challenge_completed",
  "creator_announcement_published",
  "creator_offer_link_clicked",
] as const;

export type PlatformEventType = (typeof PLATFORM_EVENT_TYPES)[number];
