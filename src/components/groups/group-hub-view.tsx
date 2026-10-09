"use client";

import { GroupOwnerPendingCard } from "@/components/groups/group-owner-pending-card";
import { GroupTabChat } from "@/components/groups/group-tab-chat";
import { GroupTabProgress } from "@/components/groups/group-tab-progress";
import { GroupTabToday } from "@/components/groups/group-tab-today";
import type { AccountabilityGroup, GroupActivity } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type HubTab = "today" | "chat" | "progress";

const TAB_LABELS: { id: HubTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "chat", label: "Chat" },
  { id: "progress", label: "Progress" },
];

export function GroupHubView({
  group,
  feed,
  viewerUserId = null,
}: {
  group: AccountabilityGroup;
  feed: GroupActivity[];
  viewerUserId?: string | null;
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
        setStatus(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {group.isOwner ? (
        <GroupOwnerPendingCard
          pendingRequests={group.pendingRequests}
          joinMode={group.joinMode}
        />
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TAB_LABELS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={
              tab === t.id
                ? "shrink-0 rounded-full bg-[#3156E8] px-4 py-2 text-xs font-semibold text-white"
                : "shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted-foreground"
            }
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <GroupTabToday
          group={group}
          viewerUserId={viewerUserId}
          pending={pending}
          run={run}
          onOpenProgress={() => setTab("progress")}
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
