"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import {
  approveGroupJoinRequestAction,
  blockUserAction,
  declineGroupJoinRequestAction,
  regenerateGroupInviteAction,
  setGroupInvitesEnabledAction,
  updateGroupSettingsAction,
  type GroupJoinMode,
} from "@/app/(app)/groups/actions";
import { submitContentReportAction } from "@/app/(app)/moderation/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GROUP_CHECK_IN_FREQUENCY_OPTIONS,
  GROUP_VISIBILITY_OPTIONS,
  type GroupCheckInFrequency,
  type GroupVisibility,
} from "@/lib/groups/discovery";
import type { GroupJoinRequest } from "@/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type GroupInviteSettingsProps = {
  groupId: string;
  joinMode: GroupJoinMode;
  invitesEnabled: boolean;
  visibility: GroupVisibility;
  discoveryPaused: boolean;
  checkInFrequency: GroupCheckInFrequency;
  discoverySummary: string;
  discoveryOwnerEligible: boolean;
  pendingRequests: GroupJoinRequest[];
  onClose: () => void;
};

export function GroupInviteSettings({
  groupId,
  joinMode,
  invitesEnabled,
  visibility,
  discoveryPaused,
  checkInFrequency,
  discoverySummary,
  discoveryOwnerEligible,
  pendingRequests,
  onClose,
}: GroupInviteSettingsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [localSummary, setLocalSummary] = useState(discoverySummary);
  const [localFrequency, setLocalFrequency] = useState(checkInFrequency);
  const [localVisibility, setLocalVisibility] = useState(visibility);
  const [localDiscoveryPaused, setLocalDiscoveryPaused] = useState(discoveryPaused);

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
        <h3 className="text-lg font-semibold">Invitation & discovery</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Only you can change these. Members can still share the invite link and code.
        </p>
      </div>

      <label className="block text-sm">
        <span className="font-medium">Group visibility</span>
        <select
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={localVisibility}
          disabled={pending || !discoveryOwnerEligible}
          onChange={(e) => {
            const next = e.target.value as GroupVisibility;
            setLocalVisibility(next);
            startTransition(async () => {
              try {
                await updateGroupSettingsAction({ groupId, visibility: next });
                router.refresh();
              } catch (err) {
                setLocalVisibility(visibility);
                setStatus(userFacingErrorMessage(err, "Update failed."));
              }
            });
          }}
        >
          {GROUP_VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!discoveryOwnerEligible ? (
          <span className="mt-1 block text-xs text-muted-foreground">
            Discoverable groups require verified adult (18+) status on your account. Invite-only
            groups still work as usual.
          </span>
        ) : (
          <span className="mt-1 block text-xs text-muted-foreground">
            {GROUP_VISIBILITY_OPTIONS.find((o) => o.value === localVisibility)?.description}
          </span>
        )}
      </label>

      {localVisibility === "discoverable" ? (
        <>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 text-sm">
            <span>
              <span className="font-medium">Pause discovery requests</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Hide from Find a Group without changing members
              </span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-primary"
              checked={localDiscoveryPaused}
              disabled={pending}
              onChange={() => {
                const next = !localDiscoveryPaused;
                setLocalDiscoveryPaused(next);
                startTransition(async () => {
                  try {
                    await updateGroupSettingsAction({ groupId, discoveryPaused: next });
                    router.refresh();
                  } catch (err) {
                    setLocalDiscoveryPaused(discoveryPaused);
                    setStatus(userFacingErrorMessage(err, "Update failed."));
                  }
                });
              }}
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium">Check-in rhythm (discovery)</span>
            <select
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={localFrequency}
              disabled={pending}
              onChange={(e) => {
                const next = e.target.value as GroupCheckInFrequency;
                setLocalFrequency(next);
                startTransition(async () => {
                  try {
                    await updateGroupSettingsAction({ groupId, checkInFrequency: next });
                    router.refresh();
                  } catch (err) {
                    setLocalFrequency(checkInFrequency);
                    setStatus(userFacingErrorMessage(err, "Update failed."));
                  }
                });
              }}
            >
              {GROUP_CHECK_IN_FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium">Discovery description</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              rows={2}
              maxLength={280}
              value={localSummary}
              disabled={pending}
              onChange={(e) => setLocalSummary(e.target.value)}
              onBlur={() => {
                if (localSummary.trim() === discoverySummary.trim()) return;
                startTransition(async () => {
                  try {
                    await updateGroupSettingsAction({
                      groupId,
                      discoverySummary: localSummary,
                    });
                    router.refresh();
                  } catch (err) {
                    setLocalSummary(discoverySummary);
                    setStatus(userFacingErrorMessage(err, "Update failed."));
                  }
                });
              }}
            />
          </label>
        </>
      ) : null}

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
                setStatus(userFacingErrorMessage(e, "Update failed."));
              }
            })
          }
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">Who can join with an invite?</span>
        <select
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={joinMode}
          disabled={pending || localVisibility === "discoverable"}
          onChange={(e) =>
            startTransition(async () => {
              try {
                await updateGroupSettingsAction({
                  groupId,
                  joinMode: e.target.value as GroupJoinMode,
                });
                router.refresh();
              } catch (e) {
                setStatus(userFacingErrorMessage(e, "Update failed."));
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
              setStatus(userFacingErrorMessage(e, "Could not regenerate."));
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
                className="space-y-2 rounded-xl border border-border p-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      displayName={req.displayName}
                      avatarUrl={req.avatarUrl}
                      size="sm"
                    />
                    <div>
                      <span className="text-sm font-medium">{req.displayName}</span>
                      {req.requestSource === "discovery" ? (
                        <span className="block text-[10px] uppercase tracking-wide text-primary">
                          Via group discovery
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="min-h-9 px-3 text-xs"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          try {
                            await approveGroupJoinRequestAction(req.id);
                            router.refresh();
                          } catch (e) {
                            setStatus(userFacingErrorMessage(e, "Could not approve."));
                          }
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
                          try {
                            await declineGroupJoinRequestAction(req.id);
                            router.refresh();
                          } catch (e) {
                            setStatus(userFacingErrorMessage(e, "Could not decline."));
                          }
                        })
                      }
                    >
                      Decline
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-8 px-2 text-xs text-muted-foreground"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          await blockUserAction(req.userId);
                          setStatus(`${req.displayName} blocked.`);
                          router.refresh();
                        } catch (e) {
                          setStatus(userFacingErrorMessage(e, "Could not block."));
                        }
                      })
                    }
                  >
                    Block
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-8 px-2 text-xs text-muted-foreground"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          await submitContentReportAction({
                            contentType: "profile_avatar",
                            contentId: req.userId,
                            reportedUserId: req.userId,
                            reason: "harassment_hate",
                            explanation: "Report from group join request review",
                          });
                          setStatus("Report submitted for review.");
                        } catch (e) {
                          setStatus(userFacingErrorMessage(e, "Could not report."));
                        }
                      })
                    }
                  >
                    Report
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
