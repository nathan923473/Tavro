"use client";

import { recordCreatorChallengeShareAction } from "@/app/(app)/studio/share-actions";
import { Button } from "@/components/ui/button";
import { getAppBaseUrl } from "@/lib/site-url";
import { Share2 } from "lucide-react";
import { useState } from "react";

type ShareChallengeButtonProps = {
  path: string;
  title: string;
  text?: string;
  fullWidth?: boolean;
  variant?: "primary" | "outline" | "secondary";
  challengeId?: string;
};

export function ShareChallengeButton({
  path,
  title,
  text,
  fullWidth,
  variant = "secondary",
  challengeId,
}: ShareChallengeButtonProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function share() {
    const url = `${getAppBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
    setMessage(null);
    if (challengeId) {
      const recorded = await recordCreatorChallengeShareAction(challengeId);
      if (!recorded.ok && recorded.message) setMessage(recorded.message);
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text ?? `Join my free challenge: ${title}`,
          url,
        });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied — paste in Instagram or Messages.");
    } catch {
      setMessage(url);
    }
  }

  return (
    <div className={fullWidth ? "w-full" : undefined}>
      <Button
        type="button"
        variant={variant}
        fullWidth={fullWidth}
        onClick={share}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        Share challenge
      </Button>
      {message ? (
        <p className="mt-1 text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
