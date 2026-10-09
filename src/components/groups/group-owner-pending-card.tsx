"use client";

import {
  approveGroupJoinRequestAction,
  declineGroupJoinRequestAction,
} from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
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

  if (joinMode !== "approval" || pendingRequests.length === 0) {
    return null;
  }

  const count = pendingRequests.length;
  const headline =
    count === 1
      ? "Someone wants to join your group"
      : `${count} people want to join your group`;

  return (
    <div
      className="overflow-hidden rounded-2xl border-2 border-primary/35 bg-primary/10 shadow-sm"
      role="region"
      aria-label="Pending membership requests"
    >
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <UserPlus className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Action needed</p>
          <h3 className="mt-0.5 text-base font-semibold text-[#1B2440]">{headline}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve to add them to your group, or decline if it&apos;s not a fit.
          </p>
        </div>
      </div>

      <ul className="space-y-0 border-t border-primary/20 bg-surface/80">
        {pendingRequests.map((req) => (
          <li
            key={req.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar displayName={req.displayName} avatarUrl={req.avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{req.displayName}</p>
                <p className="text-xs text-muted-foreground">Requested to join</p>
              </div>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                className="min-h-10 flex-1 sm:flex-none sm:px-4"
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
                className="min-h-10 flex-1 sm:flex-none sm:px-4"
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

      {status ? (
        <p className="border-t border-primary/20 px-4 py-2 text-sm text-red-600" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
