"use client";

import {
  approveGroupJoinRequestAction,
  declineGroupJoinRequestAction,
  regenerateGroupInviteAction,
  setGroupInvitesEnabledAction,
  updateGroupSettingsAction,
  type GroupJoinMode,
} from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GroupJoinRequest } from "@/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type GroupInviteSettingsProps = {
  groupId: string;
  joinMode: GroupJoinMode;
  invitesEnabled: boolean;
  pendingRequests: GroupJoinRequest[];
  onClose: () => void;
};

export function GroupInviteSettings({
  groupId,
  joinMode,
  invitesEnabled,
  pendingRequests,
  onClose,
}: GroupInviteSettingsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  return (
    <Card className="space-y-4 border-primary/20">
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-primary"
        onClick={onClose}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to group
      </button>

      <div>
        <h3 className="text-lg font-semibold">Invitation settings</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Only you can change these. Members can still share the invite link and code.
        </p>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 text-sm">
        <span>
          <span className="font-medium">Invitations enabled</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Turn off to pause new join requests
          </span>
        </span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-primary"
          checked={invitesEnabled}
          disabled={pending}
          onChange={() =>
            startTransition(async () => {
              try {
                await setGroupInvitesEnabledAction(groupId, !invitesEnabled);
                router.refresh();
              } catch (e) {
                setStatus(e instanceof Error ? e.message : "Update failed.");
              }
            })
          }
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">Who can join?</span>
        <select
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={joinMode}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              try {
                await updateGroupSettingsAction({
                  groupId,
                  joinMode: e.target.value as GroupJoinMode,
                });
                router.refresh();
              } catch (e) {
                setStatus(e instanceof Error ? e.message : "Update failed.");
              }
            })
          }
        >
          <option value="approval">Owner approval required</option>
          <option value="auto">Anyone with a valid invite joins automatically</option>
        </select>
      </label>

      <Button
        type="button"
        variant="outline"
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await regenerateGroupInviteAction(groupId);
              setStatus("New invite code and link generated. Old invites stop working.");
              router.refresh();
            } catch (e) {
              setStatus(e instanceof Error ? e.message : "Could not regenerate.");
            }
          })
        }
      >
        Regenerate invitation code & link
      </Button>

      <div>
        <h4 className="text-sm font-semibold">Pending membership requests</h4>
        {pendingRequests.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pendingRequests.map((req) => (
              <li
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-2"
              >
                <div className="flex items-center gap-2">
                  <UserAvatar
                    displayName={req.displayName}
                    avatarUrl={req.avatarUrl}
                    size="sm"
                  />
                  <span className="text-sm font-medium">{req.displayName}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="min-h-9 px-3 text-xs"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await approveGroupJoinRequestAction(req.id);
                        router.refresh();
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    className="min-h-9 px-3 text-xs"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await declineGroupJoinRequestAction(req.id);
                        router.refresh();
                      })
                    }
                  >
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status ? (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </Card>
  );
}
