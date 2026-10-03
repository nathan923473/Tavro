import { ChallengesInteractive } from "@/components/challenges/challenges-interactive";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { creatorCommunities } from "@/lib/mock-creators";
import { Sparkles } from "lucide-react";
import Link from "next/link";

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
        <Link
          href="/challenges/create"
          className="block rounded-2xl border border-dashed border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-primary"
        >
          + Create private invite-only challenge
        </Link>

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

        <ChallengesInteractive />

        <section aria-labelledby="creators-heading">
          <h2
            id="creators-heading"
            className="mb-2 flex items-center gap-2 px-1 text-base font-semibold"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            Creator communities
          </h2>
          <ul className="mb-6 space-y-2">
            {creatorCommunities.map((c) => (
              <li key={c.id}>
                <Link href={`/creator/${c.slug}`}>
                  <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: c.brandColor }}
                    >
                      {c.avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{c.communityName}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.memberCount.toLocaleString()} members ·{" "}
                        {c.challengesHosted} challenges
                      </p>
                    </div>
                  </Card>
                </Link>
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
