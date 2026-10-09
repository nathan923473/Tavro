"use client";

import {
  deleteAccountabilityGroupAction,
  leaveGroupAction,
  removeGroupMemberAction,
  setGroupParticipationPauseAction,
  transferGroupOwnershipAction,
  updateGroupSettingsAction,
} from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ACCOUNTABILITY_GROUP_SINGULAR } from "@/lib/copy/accountability-groups";
import type { AccountabilityGroup } from "@/types";
import { Users, X } from "lucide-react";
import { useEffect, useState } from "react";

export function GroupHubSettingsModal({
  open,
  onClose,
  group,
  pending,
  run,
}: {
  open: boolean;
  onClose: () => void;
  group: AccountabilityGroup;
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description);
  const [editSharedGoal, setEditSharedGoal] = useState(group.sharedGoal);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (!open) return;
    setEditName(group.name);
    setEditDescription(group.description);
    setEditSharedGoal(group.sharedGoal);
    setDeleteConfirm("");
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, group, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="group-settings-title" className="w-full max-w-lg">
        <Card className="relative max-h-[85vh] overflow-y-auto">
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <h2 id="group-settings-title" className="text-lg font-semibold">
            Group settings
          </h2>

          <section className="mt-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" aria-hidden />
              Members ({group.memberCount})
            </h3>
            <ul className="space-y-2">
              {group.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
                >
                  <UserAvatar displayName={member.displayName} avatarUrl={member.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.displayName}
                      {member.id === group.ownerId ? (
                        <span className="ml-1 text-xs text-muted-foreground">· Owner</span>
                      ) : null}
                    </p>
                  </div>
                  {group.isOwner && member.id !== group.ownerId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-9 px-2 text-xs"
                      disabled={pending}
                      onClick={() => run(() => removeGroupMemberAction(group.id, member.id))}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {group.isOwner ? (
            <section className="mt-4 space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Owner details</h3>
              <label className="block text-sm">
                Group name
                <input
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Description
                <textarea
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Shared theme / goal (optional)
                <input
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  value={editSharedGoal}
                  onChange={(e) => setEditSharedGoal(e.target.value)}
                />
              </label>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={pending}
                onClick={() =>
                  run(() =>
                    updateGroupSettingsAction({
                      groupId: group.id,
                      name: editName,
                      description: editDescription,
                      sharedGoal: editSharedGoal,
                    }),
                  )
                }
              >
                Save group details
              </Button>
              {group.members.length > 1 ? (
                <label className="block text-sm">
                  Transfer ownership to
                  <select
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      const nextOwner = e.target.value;
                      if (!nextOwner) return;
                      run(() => transferGroupOwnershipAction(group.id, nextOwner));
                    }}
                  >
                    <option value="">Select member…</option>
                    {group.members
                      .filter((m) => m.id !== group.ownerId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName}
                        </option>
                      ))}
                  </select>
                </label>
              ) : null}
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
                <input
                  className="mt-2 w-full rounded-lg border border-red-200 px-2 py-1.5 text-sm"
                  placeholder={`Type "${group.name}" to confirm`}
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  className="mt-2 border-red-300 text-red-700"
                  disabled={pending || deleteConfirm.trim() !== group.name}
                  onClick={() => run(() => deleteAccountabilityGroupAction(group.id, deleteConfirm))}
                >
                  Delete group permanently
                </Button>
              </div>
            </section>
          ) : null}

          <section className="mt-4 space-y-2 border-t border-border pt-4">
            <Button
              variant="outline"
              fullWidth
              disabled={pending}
              onClick={() => run(() => leaveGroupAction(group.id))}
            >
              Leave {ACCOUNTABILITY_GROUP_SINGULAR}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              disabled={pending}
              onClick={() =>
                run(() =>
                  setGroupParticipationPauseAction(
                    group.id,
                    group.viewerPausedUntil
                      ? null
                      : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                  ),
                )
              }
            >
              {group.viewerPausedUntil ? "Resume participation" : "Pause participation for 7 days"}
            </Button>
          </section>
        </Card>
      </div>
    </div>
  );
}
