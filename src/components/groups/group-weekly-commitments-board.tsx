"use client";

import {
  deleteGroupWeeklyCommitmentAction,
  updateGroupCommitmentProgressAction,
} from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import type { GroupWeeklyCommitment } from "@/types";
import { useMemo } from "react";

type MemberCommitments = {
  userId: string;
  displayName: string;
  isOwn: boolean;
  items: GroupWeeklyCommitment[];
};

function groupByMember(commitments: GroupWeeklyCommitment[]): MemberCommitments[] {
  const order: string[] = [];
  const byUser = new Map<string, GroupWeeklyCommitment[]>();
  for (const item of commitments) {
    const list = byUser.get(item.userId);
    if (list) {
      list.push(item);
    } else {
      byUser.set(item.userId, [item]);
      order.push(item.userId);
    }
  }

  return order
    .map((userId) => {
      const items = byUser.get(userId) ?? [];
      return {
        userId,
        displayName: items[0]?.displayName ?? "Member",
        isOwn: Boolean(items[0]?.isOwn),
        items,
      };
    })
    .sort((a, b) => {
      if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });
}

export function GroupWeeklyCommitmentsBoard({
  commitments,
  pending,
  run,
}: {
  commitments: GroupWeeklyCommitment[];
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const members = useMemo(() => groupByMember(commitments), [commitments]);

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No commitments yet this week.</p>;
  }

  return (
    <ul className="space-y-3">
      {members.map((member) => (
        <li key={member.userId} className="space-y-2">
          <p className="text-sm font-medium">{member.isOwn ? "You" : member.displayName}</p>
          <ul className="space-y-2">
            {member.items.map((commitment) => {
              const done = commitment.progressCount >= commitment.targetCount;
              const logged = Math.min(commitment.progressCount, commitment.targetCount);
              return (
                <li
                  key={commitment.id}
                  className={`rounded-xl border px-3 py-2 ${done ? "border-[#B8F4DA] bg-[#B8F4DA]/25" : "border-border"}`}
                >
                  <p className={`text-sm font-medium ${done ? "opacity-80" : ""}`}>
                    {commitment.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {logged}/{commitment.targetCount} completed
                  </p>
                  {member.isOwn ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 px-2 text-xs"
                        disabled={pending || done}
                        onClick={() =>
                          run(() =>
                            updateGroupCommitmentProgressAction(
                              commitment.id,
                              commitment.progressCount + 1,
                            ),
                          )
                        }
                      >
                        Log one time
                      </Button>
                      {commitment.progressCount > 0 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-8 px-2 text-xs"
                          disabled={pending}
                          onClick={() =>
                            run(() =>
                              updateGroupCommitmentProgressAction(
                                commitment.id,
                                commitment.progressCount - 1,
                              ),
                            )
                          }
                        >
                          Undo last log
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-8 px-2 text-xs"
                        disabled={pending}
                        onClick={() => run(() => deleteGroupWeeklyCommitmentAction(commitment.id))}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
