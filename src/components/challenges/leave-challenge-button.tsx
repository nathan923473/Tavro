"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { leaveChallengeAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LeaveChallengeButtonProps = {
  challengeId: string;
  label?: string;
  className?: string;
  fullWidth?: boolean;
  variant?: "outline" | "ghost";
  redirectTo?: string | null;
  onStatus?: (message: string) => void;
};

const DEFAULT_CONFIRM =
  "Leave this challenge? Your personal progress for it will no longer appear in Tavro. You can join again later if the challenge is still open.";

export function LeaveChallengeButton({
  challengeId,
  label = "Leave challenge",
  className,
  fullWidth = true,
  variant = "outline",
  redirectTo = null,
  onStatus,
}: LeaveChallengeButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function runLeave() {
    startTransition(async () => {
      try {
        await leaveChallengeAction(challengeId);
        onStatus?.("You left this challenge.");
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
        setConfirming(false);
      } catch (e) {
        onStatus?.(userFacingErrorMessage(e, "Could not leave challenge."));
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className={cn("space-y-2 rounded-xl border border-red-200 bg-red-50/80 p-3", className)}>
        <p className="text-sm text-foreground">{DEFAULT_CONFIRM}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            fullWidth={fullWidth}
            disabled={pending}
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={runLeave}
          >
            {pending ? "Leaving…" : "Yes, leave"}
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth={fullWidth}
            disabled={pending}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      fullWidth={fullWidth}
      disabled={pending}
      className={cn(
        variant === "outline" && "border-red-200 text-red-700 hover:bg-red-50",
        className,
      )}
      onClick={() => setConfirming(true)}
    >
      {label}
    </Button>
  );
}
