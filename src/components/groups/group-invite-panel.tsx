"use client";

import { GroupInviteSettings } from "@/components/groups/group-invite-settings";
import { Button } from "@/components/ui/button";
import { formatGroupInviteCodeDisplay } from "@/lib/groups/invite-code-display";
import { groupInvitePath } from "@/lib/site-url";
import type {
  GroupCheckInFrequency,
  GroupJoinMode,
  GroupJoinRequest,
  GroupVisibility,
} from "@/types";
import { ChevronRight, Share2 } from "lucide-react";
import { useState } from "react";

const SHARE_MESSAGE =
  "Join my private accountability group on Tavro! Let's work toward our fitness goals together.";

export function GroupInvitePanel({
  inviteCode,
  invitesEnabled,
  isOwner,
  groupId,
  memberCount,
  maxMembers,
  joinMode,
  pendingRequests,
  visibility = "private",
  discoveryPaused = false,
  checkInFrequency = "flexible",
  discoverySummary = "",
  discoveryOwnerEligible = false,
}: {
  inviteCode: string;
  invitesEnabled: boolean;
  isOwner: boolean;
  groupId: string;
  memberCount: number;
  maxMembers: number;
  joinMode: GroupJoinMode;
  pendingRequests: GroupJoinRequest[];
  visibility?: GroupVisibility;
  discoveryPaused?: boolean;
  checkInFrequency?: GroupCheckInFrequency;
  discoverySummary?: string;
  discoveryOwnerEligible?: boolean;
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const displayCode = formatGroupInviteCodeDisplay(inviteCode);
  const inviteUrl = groupInvitePath(inviteCode);
  const spotsLeft = Math.max(0, maxMembers - memberCount);
  const friendWord = spotsLeft === 1 ? "friend" : "friends";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopiedCode(true);
      setShareFeedback(null);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setShareFeedback("Could not copy — try again.");
    }
  }

  async function shareInvite() {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${inviteUrl}`
        : inviteUrl;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Tavro accountability group",
          text: `${SHARE_MESSAGE}\n\nCode: ${displayCode}`,
          url: fullUrl,
        });
        setShareFeedback("Shared!");
        window.setTimeout(() => setShareFeedback(null), 2500);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${SHARE_MESSAGE}\n${fullUrl}\nCode: ${displayCode}`);
      setShareFeedback("Link copied to clipboard");
      window.setTimeout(() => setShareFeedback(null), 2500);
    } catch {
      setShareFeedback("Sharing unavailable — use Copy code.");
    }
  }

  if (showSettings && isOwner) {
    return (
      <GroupInviteSettings
        groupId={groupId}
        joinMode={joinMode}
        invitesEnabled={invitesEnabled}
        visibility={visibility}
        discoveryPaused={discoveryPaused}
        checkInFrequency={checkInFrequency}
        discoverySummary={discoverySummary}
        discoveryOwnerEligible={discoveryOwnerEligible}
        pendingRequests={pendingRequests}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  if (!invitesEnabled && !isOwner) {
    return (
      <p className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Invites are paused. Ask the owner to re-enable invitations.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="space-y-3 px-4 pb-4 pt-4">
        <div>
          <h3 className="text-base font-semibold text-[#1B2440]">Invite your friends</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {spotsLeft > 0
              ? `Share your group with up to ${spotsLeft} ${friendWord}.`
              : "Your group is full — no more spots available."}
          </p>
        </div>

        <div className="rounded-xl bg-[#B8F4DA]/35 px-3 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B2440]/70">
            Your group code
          </p>
          <p
            className="mt-2 font-mono text-2xl font-bold tracking-[0.35em] text-[#1B2440] sm:text-3xl"
            aria-label={`Group invite code ${displayCode}`}
          >
            {displayCode}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="secondary"
            className="min-h-10 flex-1 text-sm"
            onClick={() => void copyCode()}
            disabled={!invitesEnabled || spotsLeft === 0}
          >
            {copiedCode ? "Copied!" : "Copy code"}
          </Button>
          <Button
            type="button"
            className="min-h-10 flex-1 bg-[#3156E8] text-sm text-white hover:bg-[#2442C4]"
            onClick={() => void shareInvite()}
            disabled={!invitesEnabled || spotsLeft === 0}
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Share invite
          </Button>
        </div>

        {shareFeedback ? (
          <p className="text-center text-xs font-medium text-primary" role="status">
            {shareFeedback}
          </p>
        ) : null}

        {!invitesEnabled && isOwner ? (
          <p className="text-center text-xs text-amber-800">
            Invitations are disabled — open settings to turn them back on.
          </p>
        ) : null}
      </div>

      {isOwner ? (
        <button
          type="button"
          className="flex w-full items-center justify-between border-t border-border bg-muted/20 px-4 py-3 text-left text-sm font-medium text-[#3156E8]"
          onClick={() => setShowSettings(true)}
        >
          <span>
            Invitation settings
            {pendingRequests.length > 0 ? (
              <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                {pendingRequests.length} pending
              </span>
            ) : null}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
