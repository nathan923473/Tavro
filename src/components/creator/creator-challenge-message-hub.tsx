import { ChallengeGroupChat } from "@/components/challenges/challenge-group-chat";
import { fetchChallengeMessages } from "@/lib/data/messages";
import type { CreatorCommunityChallenge } from "@/types/creator-community";

type CreatorChallengeMessageHubProps = {
  creatorDisplayName: string;
  challenges: CreatorCommunityChallenge[];
};

export async function CreatorChallengeMessageHub({
  creatorDisplayName,
  challenges,
}: CreatorChallengeMessageHubProps) {
  const active = challenges.filter((c) => c.timeline !== "previous");

  if (active.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active challenges to message. Create one from Creator Studio.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {await Promise.all(
        active.map(async (challenge) => {
          const messages = await fetchChallengeMessages(challenge.id);
          return (
            <ChallengeGroupChat
              key={challenge.id}
              challengeId={challenge.id}
              challengeTitle={challenge.title}
              viewerName={creatorDisplayName}
              viewerRole="creator"
              canPost
              messages={messages}
            />
          );
        }),
      )}
    </div>
  );
}
