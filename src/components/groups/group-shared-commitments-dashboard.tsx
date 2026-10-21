"use client";

import {
  celebrateSharedHabitAction,
  sendGroupEncouragementAction,
} from "@/app/(app)/groups/actions";
import { toggleGoalAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { statusLabel } from "@/lib/groups/shared-habit-status";
import type { AccountabilityGroup, GroupSharedCommitment } from "@/types";
import { ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";

function statusTone(status: GroupSharedCommitment["todayStatus"]): string {
  switch (status) {
    case "completed":
      return "bg-[#B8F4DA]/40 text-[#1B2440] border-[#B8F4DA]";
    case "pending":
      return "bg-secondary/60 text-foreground border-border";
    case "missed":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-surface text-muted-foreground border-border";
  }
}

export function GroupSharedCommitmentsDashboard({
  group,
  pending,
  run,
}: {
  group: AccountabilityGroup;
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const [encourageUserId, setEncourageUserId] = useState<string | null>(null);
  const [encourageMessage, setEncourageMessage] = useState(
    "Nice work showing up — proud of you!",
  );

  const byMember = useMemo(() => {
    const map = new Map<
      string,
      { displayName: string; avatarUrl: string | null; items: GroupSharedCommitment[] }
    >();
    for (const c of group.sharedCommitments) {
      let bucket = map.get(c.userId);
      if (!bucket) {
        bucket = {
          displayName: c.displayName,
          avatarUrl: c.avatarUrl,
          items: [],
        };
        map.set(c.userId, bucket);
      }
      bucket.items.push(c);
    }
    return [...map.entries()];
  }, [group.sharedCommitments]);

  const summary = useMemo(() => {
    const today = group.sharedCommitments.filter(
      (c) => c.todayStatus === "completed" || c.todayStatus === "pending",
    );
    const done = today.filter((c) => c.todayStatus === "completed").length;
    return { done, total: today.length };
  }, [group.sharedCommitments]);

  if (!group.sharedCommitments.length) {
    return (
      <Card className="space-y-2">
        <h3 className="font-semibold">Shared commitments</h3>
        <p className="text-sm text-muted-foreground">
          Link a Progress habit in <strong className="font-medium text-foreground">Link Progress habits</strong>{" "}
          below (or on Progress → habit settings). Daily check-offs appear here. Weekly group
          targets are separate.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">Shared commitments</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Habits shared from Progress — synced when someone checks them off.
          </p>
        </div>
        {summary.total > 0 ? (
          <p className="shrink-0 text-sm font-semibold tabular-nums text-primary">
            {summary.done}/{summary.total} done today
          </p>
        ) : null}
      </div>

      <ul className="space-y-3">
        {byMember.map(([userId, member]) => (
          <li key={userId} className="rounded-2xl border border-border/80 bg-surface/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <UserAvatar
                displayName={member.displayName}
                avatarUrl={member.avatarUrl}
                size="sm"
              />
              <p className="text-sm font-semibold">{member.displayName}</p>
            </div>
            <ul className="space-y-2">
              {member.items.map((c) => (
                <li
                  key={c.shareId}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.frequencyLabel}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(c.todayStatus)}`}
                    >
                      {statusLabel(c.todayStatus)}
                    </span>
                    {c.isOwn && c.todayStatus === "completed" ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-8 px-2 text-xs"
                        disabled={pending}
                        onClick={() => run(() => toggleGoalAction(c.memberGoalId))}
                      >
                        Undo today
                      </Button>
                    ) : null}
                    {c.todayStatus === "completed" && !c.isOwn ? (
                      <Button
                        type="button"
                        variant={c.viewerCelebrated ? "secondary" : "outline"}
                        className="min-h-8 gap-1 px-2 text-xs"
                        disabled={pending || c.viewerCelebrated}
                        onClick={() =>
                          run(() =>
                            celebrateSharedHabitAction({
                              groupId: group.id,
                              memberGoalId: c.memberGoalId,
                              forUserId: c.userId,
                            }),
                          )
                        }
                      >
                        <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
                        {c.viewerCelebrated
                          ? "Celebrated"
                          : c.celebrationCount > 0
                            ? `👍 ${c.celebrationCount}`
                            : "Celebrate"}
                      </Button>
                    ) : null}
                    {!c.isOwn && c.todayStatus !== "completed" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-8 px-2 text-xs"
                        disabled={pending}
                        onClick={() => setEncourageUserId(userId)}
                      >
                        Check in
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {encourageUserId ? (
        <div className="rounded-xl border border-primary/20 bg-secondary/30 p-3">
          <p className="text-sm font-medium">Send supportive check-in</p>
          <textarea
            className="mt-2 min-h-[72px] w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={encourageMessage}
            onChange={(e) => setEncourageMessage(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              className="min-h-9 flex-1 text-xs"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await sendGroupEncouragementAction({
                    groupId: group.id,
                    toUserId: encourageUserId,
                    message: encourageMessage,
                  });
                  setEncourageUserId(null);
                })
              }
            >
              Send encouragement
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 text-xs"
              onClick={() => setEncourageUserId(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
