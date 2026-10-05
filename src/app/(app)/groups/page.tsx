import { GroupsInteractive } from "@/components/groups/groups-interactive";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchUserGroup } from "@/lib/data/groups";

import { ACCOUNTABILITY_GROUP_PLURAL } from "@/lib/copy/accountability-groups";

export const metadata = { title: "Private accountability groups" };

export default async function GroupsPage() {
  const { user } = await getCurrentUserProfile();
  const userId = user?.id ?? null;
  const { group, feed } = userId
    ? await fetchUserGroup(userId)
    : { group: null, feed: [] };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Private accountability groups"
        subtitle={`Member-only ${ACCOUNTABILITY_GROUP_PLURAL} · 4–8 people · not visible to creators`}
      />
      <div className="space-y-4 px-4 py-4">
        <GroupsInteractive
          group={group}
          feed={feed}
          loggedIn={Boolean(userId)}
        />
      </div>
    </div>
  );
}
