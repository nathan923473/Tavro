"use client";

import { ChallengeCard } from "@/components/challenges/challenge-card";
import { Card } from "@/components/ui/card";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import type { Challenge } from "@/types";
import Link from "next/link";

export function JoinChallengeClient({ challenge }: { challenge: Challenge }) {
  const { mergeChallenge } = useDemoStore();
  const merged = mergeChallenge(challenge);

  return (
    <>
      <Card className="border-dashed">
        <p className="text-sm text-muted-foreground">
          You were invited to a <strong className="text-foreground">free</strong>{" "}
          challenge. Join below — saved on this device (demo mode).
        </p>
      </Card>
      <ChallengeCard challenge={challenge} />
      {merged.joined ? (
        <Link
          href="/"
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Go to home
        </Link>
      ) : (
        <Link
          href="/signup"
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold"
        >
          Create account to sync later
        </Link>
      )}
    </>
  );
}
