import { ChallengeCard } from "@/components/challenges/challenge-card";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { discoverChallenges, myChallenges } from "@/lib/mock-data";
import { Compass, Heart } from "lucide-react";

export const metadata = {
  title: "Challenges",
};

export default function ChallengesPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Challenges"
        subtitle="Free creator-led habits · discover & join"
      />
      <div className="space-y-6 px-4 py-4">
        <Card className="border-primary/20 bg-secondary/30">
          <div className="flex gap-3">
            <GiftIcon />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                100% free at launch
              </p>
              <p className="mt-1">
                Creators host challenges at no cost. Every challenge has a unique
                invite link for Instagram, email, or DMs. No paid tiers or shops
                in this version.
              </p>
            </div>
          </div>
        </Card>

        <section aria-labelledby="my-challenges-heading">
          <h2
            id="my-challenges-heading"
            className="mb-2 flex items-center gap-2 px-1 text-base font-semibold"
          >
            <Heart className="h-4 w-4 text-primary" aria-hidden />
            My challenges
          </h2>
          <ul className="space-y-3">
            {myChallenges.map((challenge) => (
              <li key={challenge.id}>
                <ChallengeCard challenge={challenge} showShareLink />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="discover-heading">
          <h2
            id="discover-heading"
            className="mb-2 flex items-center gap-2 px-1 text-base font-semibold"
          >
            <Compass className="h-4 w-4 text-primary" aria-hidden />
            Discover
          </h2>
          <p className="mb-3 px-1 text-sm text-muted-foreground">
            Join other creators&apos; communities — focus on encouragement and
            consistency, not competition.
          </p>
          <ul className="space-y-3">
            {discoverChallenges.map((challenge) => (
              <li key={challenge.id}>
                <ChallengeCard challenge={challenge} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function GiftIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <span className="text-lg" aria-hidden>
        🎁
      </span>
    </div>
  );
}
