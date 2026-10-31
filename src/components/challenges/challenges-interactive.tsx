"use client";

import { ChallengeCard } from "@/components/challenges/challenge-card";
import type { Challenge } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Heart } from "lucide-react";

type ChallengesInteractiveProps = {
  mine: Challenge[];
  viewerName: string;
  loggedIn: boolean;
  viewerUserId?: string | null;
};

export function ChallengesInteractive({
  mine,
  viewerName,
  loggedIn,
  viewerUserId = null,
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
          <EmptyState
            icon={<Heart className="h-6 w-6" aria-hidden />}
            title="No challenges yet"
            description="Search above to join a free challenge — it will show up here."
          />
        ) : (
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {mine.map((challenge) => (
              <li key={challenge.id}>
                <ChallengeCard
                  challenge={challenge}
                  showShareLink
                  viewerName={viewerName}
                  viewerRole="member"
                  loggedIn={loggedIn}
                  viewerUserId={viewerUserId}
                  deferChatLoad
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
