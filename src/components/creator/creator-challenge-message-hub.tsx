"use client";

import { ChallengeGroupChat } from "@/components/challenges/challenge-group-chat";
import { Card } from "@/components/ui/card";
import { getChallengeIdByInviteSlug } from "@/lib/challenge-chat";
import type { CreatorCommunityChallenge } from "@/types/creator-community";

type CreatorChallengeMessageHubProps = {
  creatorDisplayName: string;
  challenges: CreatorCommunityChallenge[];
};

export function CreatorChallengeMessageHub({
  creatorDisplayName,
  challenges,
}: CreatorChallengeMessageHubProps) {
  const active = challenges.filter((c) => c.timeline !== "previous");

  if (active.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          No active challenges to message. Create one from Creator Studio.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {active.map((challenge) => {
        const challengeId = getChallengeIdByInviteSlug(challenge.inviteSlug);
        if (!challengeId) {
          return (
            <Card key={challenge.id}>
              <p className="font-semibold">{challenge.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Group chat is not wired for this challenge slug yet (
                {challenge.inviteSlug}).
              </p>
            </Card>
          );
        }

        return (
          <ChallengeGroupChat
            key={challenge.id}
            challengeId={challengeId}
            challengeTitle={challenge.title}
            viewerName={creatorDisplayName}
            viewerRole="creator"
            canPost
          />
        );
      })}
    </div>
  );
}
