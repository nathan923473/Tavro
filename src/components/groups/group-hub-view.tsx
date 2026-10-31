"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { GroupOverviewHeader } from "@/components/groups/group-overview-header";
import { GroupOwnerPendingCard } from "@/components/groups/group-owner-pending-card";
import { GroupTabChat } from "@/components/groups/group-tab-chat";
import { GroupTabProgress } from "@/components/groups/group-tab-progress";
import { GroupTabToday } from "@/components/groups/group-tab-today";
import { TabPills } from "@/components/ui/tab-pills";
import type { AccountabilityGroup, GroupActivity, PersonalGoal } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type HubTab = "today" | "chat" | "progress";

const TAB_LABELS: { id: HubTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "chat", label: "Chat" },
  { id: "progress", label: "Commitments" },
];

export function GroupHubView({
  group,
  feed,
  viewerUserId = null,
  viewerHabits = [],
  discoveryOwnerEligible = false,
}: {
  group: AccountabilityGroup;
  feed: GroupActivity[];
  viewerUserId?: string | null;
  viewerHabits?: PersonalGoal[];
  discoveryOwnerEligible?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<HubTab>("today");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action();
        setStatus(null);
        router.refresh();
      } catch (e) {
        setStatus(userFacingErrorMessage(e, "Something went wrong."));
      }
    });
  }

  return (
    <div className="page-stack-compact">
      <GroupOverviewHeader group={group} />
      {group.isOwner ? (
        <GroupOwnerPendingCard
          pendingRequests={group.pendingRequests}
          joinMode={group.joinMode}
        />
      ) : null}

      <TabPills tabs={TAB_LABELS} active={tab} onChange={setTab} />

      {tab === "today" ? (
        <GroupTabToday
          group={group}
          viewerUserId={viewerUserId}
          pending={pending}
          run={run}
          onOpenProgress={() => setTab("progress")}
          discoveryOwnerEligible={discoveryOwnerEligible}
        />
      ) : null}

      {tab === "chat" ? (
        <GroupTabChat feed={feed} viewerUserId={viewerUserId} pending={pending} run={run} />
      ) : null}

      {tab === "progress" ? (
        <GroupTabProgress
          group={group}
          feed={feed}
          viewerUserId={viewerUserId}
          viewerHabits={viewerHabits}
          pending={pending}
          run={run}
        />
      ) : null}

      {status ? (
        <p
          className={
            /transfer|failed|migration|could not|only the|run migration/i.test(status)
              ? "text-sm text-red-600"
              : "text-sm text-muted-foreground"
          }
          role="status"
        >
          {status}
        </p>
      ) : null}
    </div>
  );
}
