import { GroupsInteractive } from "@/components/groups/groups-interactive";
import { PageHeader } from "@/components/layout/page-header";
import { RouteFallback } from "@/components/layout/route-fallback";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  fetchDiscoveryEligibility,
  fetchDiscoverableGroups,
} from "@/lib/data/group-discovery";
import { fetchUserGroup } from "@/lib/data/groups";
import { fetchAllMemberGoals } from "@/lib/data/member";

import {
  ACCOUNTABILITY_GROUP_PLURAL,
  ACCOUNTABILITY_GROUP_SIZE_LABEL,
} from "@/lib/copy/accountability-groups";
import { Suspense } from "react";

export const metadata = { title: "Private accountability groups" };

export default function GroupsPage() {
  return (
    <Suspense
      fallback={
        <RouteFallback
          title="Private accountability groups"
          subtitle={`Member-only ${ACCOUNTABILITY_GROUP_PLURAL} · ${ACCOUNTABILITY_GROUP_SIZE_LABEL.toLowerCase()} · not visible to creators`}
        />
      }
    >
      <GroupsPageContent />
    </Suspense>
  );
}

async function GroupsPageContent() {
  const { user } = await getCurrentUserProfile();
  const userId = user?.id ?? null;
  const [
    { group, feed, pendingJoin, existingGroupBlocked },
    viewerHabits,
    discoveryEligible,
  ] = userId
    ? await Promise.all([
        fetchUserGroup(userId),
        fetchAllMemberGoals(userId),
        fetchDiscoveryEligibility(userId).then((r) => r.eligible),
      ])
    : [
        { group: null, feed: [], pendingJoin: null, existingGroupBlocked: false },
        [] as Awaited<ReturnType<typeof fetchAllMemberGoals>>,
        false,
      ];

  const discoverableGroups =
    userId && !group && !pendingJoin && discoveryEligible
      ? await fetchDiscoverableGroups({})
      : [];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Private accountability groups"
        subtitle={`Member-only ${ACCOUNTABILITY_GROUP_PLURAL} · ${ACCOUNTABILITY_GROUP_SIZE_LABEL.toLowerCase()} · not visible to creators`}
      />
      <div className="space-y-4 px-4 py-4">
        <GroupsInteractive
          group={group}
          feed={feed}
          loggedIn={Boolean(userId)}
          viewerUserId={userId}
          pendingJoin={pendingJoin}
          existingGroupBlocked={existingGroupBlocked}
          discoveryEligible={discoveryEligible}
          initialDiscoverableGroups={discoverableGroups}
          viewerHabits={viewerHabits}
        />
      </div>
    </div>
  );
}
