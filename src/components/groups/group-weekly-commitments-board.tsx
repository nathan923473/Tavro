"use client";

import {
  deleteGroupWeeklyCommitmentAction,
  updateGroupCommitmentProgressAction,
} from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { AccountabilityGroup, GroupWeeklyCommitment } from "@/types";
import { useMemo } from "react";

function groupByMember(commitments: GroupWeeklyCommitment[]) {
  const map = new Map<
    string,
    { displayName: string; items: GroupWeeklyCommitment[] }
  >();
  for (const c of commitments) {
    let bucket = map.get(c.userId);
    if (!bucket) {
      bucket = { displayName: c.displayName, items: [] };
      map.set(c.userId, bucket);
    }
    bucket.items.push(c);
  }
  return [...map.entries()];
}

export function GroupWeeklyCommitmentsBoard({
  group,
  pending,
  run,
}: {
  group: AccountabilityGroup;
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const byMember = useMemo(
    () => groupByMember(group.weeklyCommitments),
    [group.weeklyCommitments],
  );

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="font-semibold">This week&apos;s group commitments</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly targets everyone in the group can see — log your own with &quot;Log one time&quot;.
          Not the same as daily linked Progress habits (see Shared commitments).
        </p>
      </div>

      {byMember.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No one has added a commitment this week yet — add yours below.
        </p>
      ) : (
        <ul className="space-y-3">
          {byMember.map(([userId, member]) => (
            <li key={userId} className="rounded-2xl border border-border/80 bg-surface/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <UserAvatar displayName={member.displayName} size="sm" />
                <p className="text-sm font-semibold">{member.displayName}</p>
              </div>
              <ul className="space-y-2">
                {member.items.map((c) => {
                  const done = c.progressCount >= c.targetCount;
                  return (
                    <li
                      key={c.id}
                      className={`rounded-xl border px-3 py-2 ${done ? "border-[#B8F4DA] bg-[#B8F4DA]/25" : "border-border bg-background"}`}
                    >
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Group weekly · {Math.min(c.progressCount, c.targetCount)} of{" "}
                        {c.targetCount} times this week
                      </p>
                      {c.isOwn ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="min-h-8 px-2 text-xs"
                            disabled={pending || done}
                            onClick={() =>
                              run(() =>
                                updateGroupCommitmentProgressAction(
                                  c.id,
                                  c.progressCount + 1,
                                ),
                              )
                            }
                          >
                            Log one time
                          </Button>
                          {c.progressCount > 0 ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-8 px-2 text-xs"
                              disabled={pending}
                              onClick={() =>
                                run(() =>
                                  updateGroupCommitmentProgressAction(
                                    c.id,
                                    c.progressCount - 1,
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
                            onClick={() => run(() => deleteGroupWeeklyCommitmentAction(c.id))}
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
      )}
    </Card>
  );
}
