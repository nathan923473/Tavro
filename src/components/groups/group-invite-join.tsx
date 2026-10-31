"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { requestJoinGroupByInviteCodeAction } from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function GroupInviteJoin({
  code,
  joinMode,
}: {
  code: string;
  joinMode?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const result = await requestJoinGroupByInviteCodeAction(code);
              setMessage(userFacingErrorMessage(result.message, "Could not join this group. Please try again."));
              if (result.status !== "pending") {
                router.push("/groups");
                router.refresh();
              }
            } catch (e) {
              setMessage(userFacingErrorMessage(e, "Could not join."));
            }
          })
        }
      >
        {joinMode === "auto" ? "Join group" : "Request to join"}
      </Button>
      {message ? (
        <p className="text-center text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
