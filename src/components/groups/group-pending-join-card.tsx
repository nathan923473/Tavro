"use client";

import { cancelGroupJoinRequestAction } from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ACCOUNTABILITY_GROUP_MAX_MEMBERS } from "@/lib/copy/accountability-groups";
import type { PendingGroupJoin } from "@/lib/data/groups";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function GroupPendingJoinCard({ pendingJoin }: { pendingJoin: PendingGroupJoin }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const maxMembers = pendingJoin.maxMembers ?? ACCOUNTABILITY_GROUP_MAX_MEMBERS;
  const memberCount = pendingJoin.memberCount ?? null;

  return (
    <Card className="overflow-hidden border-primary/25 p-0">
      <div className="bg-primary/10 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Clock className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Request pending</p>
            <h2 className="mt-0.5 text-lg font-semibold">Waiting for owner approval</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The owner of{" "}
              <strong className="text-foreground">{pendingJoin.groupName}</strong> needs to approve
              you before you can chat with the group.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border px-4 py-4">
        {pendingJoin.groupGoal ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Group goal:</span> {pendingJoin.groupGoal}
          </p>
        ) : null}
        {memberCount !== null ? (
          <p className="text-sm text-muted-foreground">
            {memberCount}/{maxMembers} members so far
          </p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          fullWidth
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await cancelGroupJoinRequestAction(pendingJoin.requestId);
              router.refresh();
            })
          }
        >
          Cancel request
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Changed your mind? Cancel to browse or join another group.
        </p>
      </div>
    </Card>
  );
}
