import { APP_NAME } from "@/lib/branding";

/** User-facing summary — must match implemented deletion behaviour. */
export const ACCOUNT_DELETION_SUMMARY = {
  deleted: [
    "Your Tavro login and Supabase Auth account",
    "Profile name, photo, timezone, and notification preferences",
    "Personal habits, goal completions, daily check-ins, and milestones",
    "Private weekly weigh-ins (if you used them)",
    "Your challenge memberships and personal challenge progress",
    "Community follows and creator studio access",
    "Your private accountability group membership",
    "Messages you posted in group or challenge chats",
    "Profile, community, and challenge images stored under your account folders",
  ],
  anonymisedOrDetached: [
    "Public challenges you created are archived and removed from discovery; other participants keep their progress",
    "Creator community pages you owned are removed; linked challenges are detached, not deleted",
    "Referral and analytics fields that referenced your account may be cleared or anonymised",
  ],
  mayRetain: [
    "Aggregated, non-identifying analytics (e.g. event counts) where your user id is already null or removed",
    "Content moderation records may retain report metadata for safety (reviewed by admins only)",
    "Backups retained by our infrastructure provider for a limited period per their policy",
  ],
} as const;

export function deletionConsequencesParagraphs(): string[] {
  return [
    `Deleting your ${APP_NAME} account is permanent. You will lose access to your profile, challenge progress, personal habits, and other account information stored for you.`,
    "Other people's challenges, groups, and progress are not deleted when you leave.",
    "If you created public challenges, they will be archived and hidden from discovery. Participants can keep their own progress.",
    "If you hosted a private accountability group, ownership transfers to another member when possible; otherwise the empty group is removed.",
  ];
}
