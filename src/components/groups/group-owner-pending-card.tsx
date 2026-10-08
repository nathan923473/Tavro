"use client";

import {
  approveGroupJoinRequestAction,
  declineGroupJoinRequestAction,
} from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { GroupJoinRequest } from "@/types";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function GroupOwnerPendingCard({
  pendingRequests,
  joinMode,
}: {
  pendingRequests: GroupJoinRequest[];
  joinMode: "approval" | "auto";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  if (joinMode !== "approval") return null;

  return (
    <Card className="space-y-3 border-primary/25">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <UserPlus className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h3 className="font-semibold">Membership requests</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingRequests.length === 0
              ? "No one is waiting right now. When someone requests to join, they’ll appear here."
              : `${pendingRequests.length} pending — approve to add them to your group.`}
          </p>
        </div>
      </div>

      {pendingRequests.length > 0 ? (
        <ul className="space-y-2">
          {pendingRequests.map((req) => (
            <li
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 p-2"
            >
              <div className="flex items-center gap-2">
                <UserAvatar
                  displayName={req.displayName}
                  avatarUrl={req.avatarUrl}
                  size="sm"
                />
                <span className="text-sm font-medium">{req.displayName}</span>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  className="min-h-9 flex-1 sm:flex-none"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await approveGroupJoinRequestAction(req.id);
                        setStatus(null);
                        router.refresh();
                      } catch (e) {
                        setStatus(e instanceof Error ? e.message : "Could not approve.");
                      }
                    })
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="min-h-9 flex-1 sm:flex-none"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await declineGroupJoinRequestAction(req.id);
                        setStatus(null);
                        router.refresh();
                      } catch (e) {
                        setStatus(e instanceof Error ? e.message : "Could not decline.");
                      }
                    })
                  }
                >
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {status ? (
        <p className="text-sm text-red-600" role="status">
          {status}
        </p>
      ) : null}
    </Card>
  );
}
