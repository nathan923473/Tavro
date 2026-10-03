"use client";

import { GroupActivityPreview } from "@/components/dashboard/group-activity-preview";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import { accountabilityGroup, demoUser, groupFeed } from "@/lib/mock-data";

export function HomeWelcomeBanner() {
  const { state } = useDemoStore();
  return (
    <WelcomeBanner
      firstName={demoUser.firstName}
      groupName={state.inGroup ? demoUser.groupName : undefined}
    />
  );
}

export function HomeGroupPreview() {
  const { state } = useDemoStore();
  if (!state.inGroup) return null;
  return <GroupActivityPreview group={accountabilityGroup} feed={groupFeed} />;
}
