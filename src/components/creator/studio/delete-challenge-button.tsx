"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { deleteChallengeFormAction } from "@/app/(app)/studio/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useTransition } from "react";

export function DeleteChallengeButton({
  challengeId,
  challengeTitle,
  participantCount,
}: {
  challengeId: string;
  challengeTitle: string;
  participantCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message =
      participantCount > 0
        ? `Delete “${challengeTitle}”? ${participantCount} participant(s) will lose access. This cannot be undone.`
        : `Delete “${challengeTitle}”? This cannot be undone.`;
    if (!window.confirm(message)) return;

    startTransition(async () => {
      try {
        setError(null);
        await deleteChallengeFormAction(challengeId);
      } catch (err) {
        setError(userFacingErrorMessage(err, "Could not delete challenge."));
      }
    });
  }

  return (
    <Card className="border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/20">
      <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">Delete challenge</h2>
      <p className="mt-1 text-xs text-red-900/80 dark:text-red-200/80">
        Permanently removes this challenge, its plan, and participant memberships. Invite links
        will stop working.
      </p>
      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <Button
          type="submit"
          fullWidth
          disabled={pending}
          className="bg-red-600 text-white hover:bg-red-700"
        >
          {pending ? "Deleting…" : "Delete this challenge"}
        </Button>
        {error ? (
          <p className="text-center text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
