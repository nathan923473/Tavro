"use client";

import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { creatorsLandingAbsoluteUrl } from "@/lib/creator/growth";
import { Share2 } from "lucide-react";
import { useState } from "react";

export function StudioInviteCreatorsPanel({
  referralCode,
  referralApplicationCount,
}: {
  referralCode: string;
  referralApplicationCount: number;
}) {
  const url = creatorsLandingAbsoluteUrl(referralCode);
  const [shareNote, setShareNote] = useState<string | null>(null);

  async function shareLink() {
    setShareNote(null);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Become a Tavro creator",
          text: "Know another fitness coach who would love running free challenges?",
          url,
        });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    setShareNote("Copy the link below to share with another coach.");
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Invite other creators</h2>
      <p className="text-sm text-muted-foreground">
        Know another fitness coach who would love running free challenges? Invite them to
        become a Tavro creator. Referrals are tracked when they apply — approval is still
        manual.
      </p>
      <CopyLinkButton url={url} label="Copy creator invite link" fullWidth />
      <Button type="button" variant="outline" fullWidth className="gap-2" onClick={shareLink}>
        <Share2 className="h-4 w-4" aria-hidden />
        Share invite
      </Button>
      {shareNote ? (
        <p className="text-xs text-muted-foreground" role="status">
          {shareNote}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {referralApplicationCount > 0
          ? `${referralApplicationCount} coach application${referralApplicationCount === 1 ? "" : "s"} linked to your invite (submitted, not auto-approved).`
          : "Referral stats appear when another coach applies using your link."}
      </p>
    </Card>
  );
}
