"use client";

import { ChallengeCard } from "@/components/challenges/challenge-card";
import { Card } from "@/components/ui/card";
import type { Challenge } from "@/types";
import Link from "next/link";

export function JoinChallengeClient({
  challenge,
  viewerName,
  loggedIn,
}: {
  challenge: Challenge;
  viewerName: string;
  loggedIn: boolean;
}) {
  return (
    <>
      <Card className="border-dashed">
        <p className="text-sm text-muted-foreground">
          You were invited to a <strong className="text-foreground">free</strong>{" "}
          challenge. Joining saves to your Streakly account.
        </p>
      </Card>
      <ChallengeCard
        challenge={challenge}
        viewerName={viewerName}
        viewerRole="member"
        loggedIn={loggedIn}
      />
      {challenge.joined ? (
        <Link
          href="/"
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Go to home
        </Link>
      ) : (
        <Link
          href={loggedIn ? "/challenges" : "/signup"}
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold"
        >
          {loggedIn ? "Browse challenges" : "Create account to join"}
        </Link>
      )}
    </>
  );
}
