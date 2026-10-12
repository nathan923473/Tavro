"use client";

import {
  celebrateSharedCommitmentAction,
  checkInSharedHabitAction,
  saveSharedCommitmentReflectionAction,
} from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AccountabilityGroup } from "@/types";
import { useState } from "react";

export function GroupTabCommitments({
  group,
  pending,
  run,
}: {
  group: AccountabilityGroup;
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const ownReflection = group.sharedReflections.find((reflection) => reflection.isOwn);
  const [reflection, setReflection] = useState(ownReflection?.body ?? "");
  const otherReflections = group.sharedReflections.filter((item) => !item.isOwn);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div>
          <h3 className="font-semibold">Shared commitments</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Only habits someone chooses to share. Everything else on Progress stays private.
          </p>
        </div>
        {group.sharedCommitments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No shared habits yet. On Progress, edit a habit and choose Share with accountability
            group.
          </p>
        ) : (
          <ul className="space-y-2">
            {group.sharedCommitments.map((commitment) => {
              const done = Math.min(commitment.progressCount, commitment.targetCount);
              const pct = commitment.targetCount
                ? Math.round((done / commitment.targetCount) * 100)
                : 0;
              return (
                <li key={commitment.shareId} className="rounded-xl border border-border px-3 py-2">
                  <p className="text-sm font-medium">
                    {commitment.isOwn ? "You" : commitment.displayName}
                    <span className="font-normal text-muted-foreground"> · {commitment.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {commitment.paused
                      ? "Paused"
                      : `${done}/${commitment.targetCount} this week`}
                    {commitment.celebrationCount > 0
                      ? ` · ${commitment.celebrationCount} celebration${commitment.celebrationCount === 1 ? "" : "s"}`
                      : ""}
                  </p>
                  {commitment.paused ? null : (
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={commitment.targetCount}
                      aria-valuenow={done}
                      aria-label={`${commitment.title}: ${done} of ${commitment.targetCount} this week`}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {commitment.isOwn ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 px-2 text-xs"
                        disabled={pending || commitment.paused || commitment.completedToday}
                        onClick={() =>
                          run(() =>
                            checkInSharedHabitAction({
                              groupId: group.id,
                              goalId: commitment.goalId,
                            }),
                          )
                        }
                      >
                        {commitment.completedToday ? "Checked in" : "Check in"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 px-2 text-xs"
                        disabled={pending || commitment.celebratedByViewer}
                        onClick={() =>
                          run(() =>
                            celebrateSharedCommitmentAction({
                              groupId: group.id,
                              shareId: commitment.shareId,
                            }),
                          )
                        }
                      >
                        {commitment.celebratedByViewer ? "Celebrated" : "Celebrate"}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <div>
          <h3 className="font-semibold">Weekly reflection</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A short note for your group about this week. It is not your private Progress reflection.
          </p>
        </div>
        <textarea
          rows={3}
          maxLength={500}
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="What helped you show up this week?"
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
        />
        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={pending}
          onClick={() =>
            run(() =>
              saveSharedCommitmentReflectionAction({
                groupId: group.id,
                body: reflection,
              }),
            )
          }
        >
          Save reflection
        </Button>
        {otherReflections.length > 0 ? (
          <ul className="space-y-2 border-t border-border pt-3">
            {otherReflections.map((item) => (
              <li key={item.userId} className="text-sm">
                <p className="font-medium">{item.displayName}</p>
                <p className="text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </div>
  );
}
