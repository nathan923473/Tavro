"use client";

import { deleteChallengeFormAction } from "@/app/(app)/studio/actions";
import { Button } from "@/components/ui/button";
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
        setError(err instanceof Error ? err.message : "Could not delete challenge.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Button type="submit" variant="outline" fullWidth disabled={pending} className="border-red-200 text-red-700">
        {pending ? "Deleting…" : "Delete challenge"}
      </Button>
      {error ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
