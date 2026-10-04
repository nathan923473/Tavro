import { GroupActivityPreview } from "@/components/dashboard/group-activity-preview";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import type { AccountabilityGroup, GroupActivity } from "@/types";

export function HomeWelcomeBanner({
  firstName,
  groupName,
}: {
  firstName: string;
  groupName?: string;
}) {
  return <WelcomeBanner firstName={firstName} groupName={groupName} />;
}

export function HomeGroupPreview({
  group,
  feed,
}: {
  group: AccountabilityGroup | null;
  feed: GroupActivity[];
}) {
  if (!group) {
    return null;
  }
  return <GroupActivityPreview group={group} feed={feed} />;
}
