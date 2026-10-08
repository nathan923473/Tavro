"use client";

import { setGroupInvitesEnabledAction } from "@/app/(app)/groups/actions";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Button } from "@/components/ui/button";
import { groupInvitePath } from "@/lib/site-url";
import { Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function GroupInvitePanel({
  inviteCode,
  invitesEnabled,
  canManageInvites,
  groupId,
}: {
  inviteCode: string;
  invitesEnabled: boolean;
  canManageInvites: boolean;
  groupId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copiedCode, setCopiedCode] = useState(false);
  const inviteUrl = groupInvitePath(inviteCode);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(false);
    }
  }

  async function shareInvite() {
    const shareData = {
      title: "Join my Tavro accountability group",
      text: `Use code ${inviteCode} or open this link to join our private group on Tavro.`,
      url: typeof window !== "undefined" ? `${window.location.origin}${inviteUrl}` : inviteUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* fall through to copy */
      }
    }
    await navigator.clipboard.writeText(shareData.url);
  }

  if (!invitesEnabled && !canManageInvites) {
    return (
      <p className="text-sm text-muted-foreground">Invites are paused for this group.</p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
      <div>
        <p className="text-sm font-semibold">Invite your friends</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Code:{" "}
          <span className="font-mono text-sm font-bold tracking-widest text-foreground">
            {inviteCode}
          </span>
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="secondary" onClick={copyCode} disabled={!invitesEnabled}>
          {copiedCode ? "Code copied" : "Copy code"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void shareInvite()}
          disabled={!invitesEnabled}
        >
          <Share2 className="h-4 w-4" aria-hidden />
          Share invite
        </Button>
      </div>
      {invitesEnabled ? (
        <CopyLinkButton url={inviteUrl} label="Copy invite link" fullWidth />
      ) : null}
      {canManageInvites ? (
        <Button
          type="button"
          variant="outline"
          fullWidth
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setGroupInvitesEnabledAction(groupId, !invitesEnabled);
              router.refresh();
            })
          }
        >
          {invitesEnabled ? "Disable invitations" : "Enable invitations"}
        </Button>
      ) : null}
    </div>
  );
}
