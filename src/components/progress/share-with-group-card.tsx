"use client";

import { shareAchievementWithGroupAction } from "@/app/(app)/progress/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useTransition } from "react";

export function ShareWithGroupCard({ loggedIn }: { loggedIn: boolean }) {
  const [message, setMessage] = useState(
    "I completed all my planned workouts this week!",
  );
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!loggedIn) return null;

  return (
    <Card>
      <h3 className="font-semibold">Share with your accountability group</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Optional — celebrate habits or milestones. Never includes weight or private
        check-in details.
      </p>
      <textarea
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm"
      />
      <Button
        type="button"
        className="mt-2"
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await shareAchievementWithGroupAction(message);
              setStatus("Shared with your group.");
            } catch (e) {
              setStatus(e instanceof Error ? e.message : "Could not share.");
            }
          })
        }
      >
        Share achievement
      </Button>
      {status ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </Card>
  );
}
