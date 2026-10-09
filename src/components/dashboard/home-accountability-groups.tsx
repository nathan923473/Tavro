"use client";

import { GroupCheckInReactions } from "@/components/groups/group-check-in-reactions";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { computeTodayAccountabilityStats } from "@/lib/groups/check-in-board-stats";
import type { AccountabilityGroup } from "@/types";
import Link from "next/link";

function firstName(displayName: string): string {
  return displayName.split(/\s+/)[0] ?? displayName;
}

export function HomeAccountabilityGroups({
  group,
  viewerUserId,
}: {
  group: AccountabilityGroup | null;
  viewerUserId: string | null;
}) {
  if (!group) {
    return (
      <section aria-labelledby="home-groups-empty" className="px-1">
        <h2 id="home-groups-empty" className="text-base font-semibold text-[#1B2440]">
          Your accountability groups
        </h2>
        <Card className="mt-2 space-y-2">
          <p className="text-sm text-muted-foreground">
            Private groups of 2–6 people help you stay consistent together.
          </p>
          <Link
            href="/groups"
            className="flex min-h-11 w-full items-center justify-center rounded-2xl border border-border bg-secondary text-sm font-semibold"
          >
            Create or join a group
          </Link>
        </Card>
      </section>
    );
  }

  const stats = computeTodayAccountabilityStats(group.checkInBoard);
  const scheduledMembers = group.checkInBoard.filter((m) => m.scheduledToday);
  const encourageTarget = group.recentCheckIns.find(
    (c) =>
      c.userId !== viewerUserId &&
      c.checkInDate === new Date().toISOString().slice(0, 10) &&
      (c.status === "completed" || c.status === "partial"),
  );

  return (
    <section aria-labelledby="home-groups-heading" className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 id="home-groups-heading" className="text-base font-semibold text-[#1B2440]">
          Your accountability groups
        </h2>
        <Link href="/groups" className="text-sm font-medium text-[#3156E8]">
          View all
        </Link>
      </div>

      <Card className="space-y-3">
        <div>
          <p className="font-semibold text-[#1B2440]">{group.name}</p>
          <p className="text-sm text-muted-foreground">
            {stats.scheduledCount > 0
              ? `${stats.checkedInCount} of ${stats.scheduledCount} checked in today`
              : "Rest day — no check-ins scheduled today"}
          </p>
        </div>

        {scheduledMembers.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {scheduledMembers.map((m) => {
              const done =
                m.checkedIn &&
                (m.status === "completed" || m.status === "partial" || m.status === "rest");
              return (
                <li key={m.userId} className="flex items-center gap-2">
                  <UserAvatar
                    displayName={m.displayName}
                    avatarUrl={m.avatarUrl}
                    size="sm"
                    className={done ? "ring-2 ring-[#B8F4DA]" : undefined}
                  />
                  <span className="flex-1">
                    {firstName(m.displayName)}{" "}
                    {done ? (
                      <span className="text-[#1B2440]">checked in ✓</span>
                    ) : (
                      <span className="text-muted-foreground">pending</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Everyone on a rest day — check the group when you&apos;re back on schedule.
          </p>
        )}

        {encourageTarget && viewerUserId ? (
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Encourage {firstName(encourageTarget.displayName)}
            </p>
            <GroupCheckInReactions
              groupId={group.id}
              targetUserId={encourageTarget.userId}
              checkInDate={encourageTarget.checkInDate}
              reactions={encourageTarget.reactions}
              viewerReactionKeys={encourageTarget.viewerReactionKeys}
              compact
            />
          </div>
        ) : null}

        <Link
          href="/groups"
          className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#3156E8] text-sm font-semibold text-white hover:bg-[#2442C4]"
        >
          Open group
        </Link>
      </Card>
    </section>
  );
}
