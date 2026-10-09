"use client";

import { GroupInvitePanel } from "@/components/groups/group-invite-panel";
import { Card } from "@/components/ui/card";
import type { GroupJoinMode, GroupJoinRequest } from "@/types";
import { X } from "lucide-react";
import { useEffect } from "react";

export function GroupInviteModal({
  open,
  onClose,
  inviteCode,
  invitesEnabled,
  isOwner,
  groupId,
  memberCount,
  maxMembers,
  joinMode,
  pendingRequests,
}: {
  open: boolean;
  onClose: () => void;
  inviteCode: string;
  invitesEnabled: boolean;
  isOwner: boolean;
  groupId: string;
  memberCount: number;
  maxMembers: number;
  joinMode: GroupJoinMode;
  pendingRequests: GroupJoinRequest[];
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="group-invite-modal-title" className="w-full max-w-md">
        <Card className="relative max-h-[85vh] overflow-y-auto p-0">
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div id="group-invite-modal-title" className="sr-only">
            Invite friends
          </div>
          <GroupInvitePanel
            inviteCode={inviteCode}
            invitesEnabled={invitesEnabled}
            isOwner={isOwner}
            groupId={groupId}
            memberCount={memberCount}
            maxMembers={maxMembers}
            joinMode={joinMode}
            pendingRequests={pendingRequests}
          />
        </Card>
      </div>
    </div>
  );
}
