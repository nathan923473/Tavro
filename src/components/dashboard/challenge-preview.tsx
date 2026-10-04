import { ChallengeCard } from "@/components/challenges/challenge-card";
import type { Challenge } from "@/types";
import Link from "next/link";

export function ChallengePreview({
  challenges,
  viewerName,
  loggedIn,
}: {
  challenges: Challenge[];
  viewerName: string;
  loggedIn: boolean;
}) {
  return (
    <section aria-labelledby="home-challenges-heading">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 id="home-challenges-heading" className="text-base font-semibold">
          My challenges
        </h2>
        <Link href="/challenges" className="text-sm font-medium text-primary">
          See all
        </Link>
      </div>
      {challenges.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">
          Join a challenge from the Challenges tab.
        </p>
      ) : (
        <ul className="space-y-3">
          {challenges.slice(0, 2).map((c) => (
            <li key={c.id}>
              <ChallengeCard
                challenge={c}
                viewerName={viewerName}
                viewerRole="member"
                loggedIn={loggedIn}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
