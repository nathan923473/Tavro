import type { GroupFocusType } from "@/types";

export type GroupCheckInFrequency = "daily" | "weekdays" | "weekly" | "flexible";

export type GroupVisibility = "private" | "discoverable";

export const GROUP_CHECK_IN_FREQUENCY_OPTIONS: {
  value: GroupCheckInFrequency;
  label: string;
}[] = [
  { value: "daily", label: "Daily check-ins" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly rhythm" },
  { value: "flexible", label: "Flexible" },
];

export const GROUP_VISIBILITY_OPTIONS: {
  value: GroupVisibility;
  label: string;
  description: string;
}[] = [
  {
    value: "private",
    label: "Private — invite only",
    description: "Not shown in group discovery. Members join with your invite code or link.",
  },
  {
    value: "discoverable",
    label: "Discoverable — join requests",
    description:
      "Appears in Find a Group for eligible adults. You approve every request; no automatic joins.",
  },
];

export type DiscoverableGroupCard = {
  id: string;
  name: string;
  focusType: GroupFocusType;
  focusCustomLabel: string;
  memberCount: number;
  maxMembers: number;
  checkInFrequency: GroupCheckInFrequency;
  discoverySummary: string;
};

export function discoveryJoinErrorMessage(code: string): string {
  switch (code) {
    case "discovery_not_available":
      return "Group discovery is limited to verified adults 18+. This safeguard is not enabled on your account yet.";
    case "not_discoverable":
      return "This group is no longer accepting discovery requests.";
    case "full":
      return "This group is full.";
    case "already_in_group":
      return "You already belong to a group.";
    case "blocked":
      return "You cannot request to join this group.";
    case "rate_limited":
      return "Too many join requests today. Try again tomorrow.";
    case "recently_declined":
      return "You were recently declined for this group. You can request again later.";
    default:
      return "Could not send request. Try again.";
  }
}
