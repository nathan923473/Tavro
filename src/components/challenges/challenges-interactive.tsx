"use client";

import { ChallengeCard } from "@/components/challenges/challenge-card";
import type { ChallengeChatMessage } from "@/lib/challenge-chat";
import type { Challenge } from "@/types";
import { Compass, Heart } from "lucide-react";

type ChallengesInteractiveProps = {
  mine: Challenge[];
  discover: Challenge[];
  viewerName: string;
  loggedIn: boolean;
  challengeMessages: Record<string, ChallengeChatMessage[]>;
};

export function ChallengesInteractive({
  mine,
  discover,
  viewerName,
  loggedIn,
  challengeMessages,
}: ChallengesInteractiveProps) {
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
                <ChallengeCard
                  challenge={challenge}
                  showShareLink
                  viewerName={viewerName}
                  viewerRole="member"
                  loggedIn={loggedIn}
                  messages={challengeMessages[challenge.id] ?? []}
                />
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
          Join creator challenges — encouragement and consistency, not
          competition.
        </p>
        {discover.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            No public challenges yet. Approved creators can publish from Creator
            Studio.
          </p>
        ) : (
          <ul className="space-y-3">
            {discover.map((challenge) => (
              <li key={challenge.id}>
                <ChallengeCard
                  challenge={challenge}
                  viewerName={viewerName}
                  viewerRole="member"
                  loggedIn={loggedIn}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
