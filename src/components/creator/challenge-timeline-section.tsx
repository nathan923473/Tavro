import { CreatorChallengeCard } from "@/components/creator/creator-challenge-card";
import type {
  ChallengeTimeline,
  CreatorCommunityChallenge,
} from "@/types/creator-community";

type ChallengeTimelineSectionProps = {
  title: string;
  timeline: ChallengeTimeline;
  challenges: CreatorCommunityChallenge[];
  creatorUserId: string;
  creatorDisplayName: string;
  creatorAvatarUrl: string | null;
  viewerUserId?: string | null;
};

export function ChallengeTimelineSection({
  title,
  timeline,
  challenges,
  creatorUserId,
  creatorDisplayName,
  creatorAvatarUrl,
  viewerUserId = null,
}: ChallengeTimelineSectionProps) {
  const items = challenges.filter((c) => c.timeline === timeline);
  if (items.length === 0) return null;

  return (
    <section className="px-4" aria-labelledby={`section-${timeline}`}>
      <h2 id={`section-${timeline}`} className="mb-2 text-base font-semibold">
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((challenge) => (
          <li key={challenge.id}>
            <CreatorChallengeCard
              challenge={challenge}
              showJoin={timeline !== "previous"}
              creatorUserId={creatorUserId}
              creatorDisplayName={creatorDisplayName}
              creatorAvatarUrl={creatorAvatarUrl}
              viewerUserId={viewerUserId}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
