"use client";

import { addWeighInAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LogWeighInCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card>
      <p className="text-sm text-muted-foreground">
        Private weekly weigh-ins stay on your account only.
      </p>
      <Button
        className="mt-3"
        variant="secondary"
        fullWidth
        disabled={pending}
        onClick={() => {
          const raw = window.prompt("Enter today's weight (lb)");
          if (raw == null) return;
          const n = Number.parseFloat(raw);
          if (!Number.isFinite(n) || n <= 0) {
            setMessage("Enter a valid number.");
            return;
          }
          startTransition(async () => {
            try {
              await addWeighInAction(n);
              setMessage("Saved.");
              router.refresh();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Could not save.");
            }
          });
        }}
      >
        Log first weigh-in
      </Button>
      {message ? (
        <p className="mt-2 text-xs text-muted-foreground">{message}</p>
      ) : null}
    </Card>
  );
}
