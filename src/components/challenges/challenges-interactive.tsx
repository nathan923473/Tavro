"use client";

import { ChallengeCard } from "@/components/challenges/challenge-card";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import { Compass, Heart } from "lucide-react";

export function ChallengesInteractive() {
  const { myChallengesList, discoverChallengesList } = useDemoStore();
  const mine = myChallengesList();
  const discover = discoverChallengesList();

  return (
    <>
      <section aria-labelledby="my-challenges-heading">
        <h2
          id="my-challenges-heading"
          className="mb-2 flex items-center gap-2 px-1 text-base font-semibold"
        >
          <Heart className="h-4 w-4 text-primary" aria-hidden />
          My challenges
        </h2>
        {mine.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            Join a challenge below to see it here.
          </p>
        ) : (
          <ul className="space-y-3">
            {mine.map((challenge) => (
              <li key={challenge.id}>
                <ChallengeCard challenge={challenge} showShareLink />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="discover-heading" className="mt-6">
        <h2
          id="discover-heading"
          className="mb-2 flex items-center gap-2 px-1 text-base font-semibold"
        >
          <Compass className="h-4 w-4 text-primary" aria-hidden />
          Discover
        </h2>
        <p className="mb-3 px-1 text-sm text-muted-foreground">
          Join creator challenges — encouragement and consistency, not competition.
        </p>
        <ul className="space-y-3">
          {discover.map((challenge) => (
            <li key={challenge.id}>
              <ChallengeCard challenge={challenge} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
