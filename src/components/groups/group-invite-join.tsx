"use client";

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
              setMessage(result.message);
              if (result.status !== "pending") {
                router.push("/groups");
                router.refresh();
              }
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Could not join.");
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
