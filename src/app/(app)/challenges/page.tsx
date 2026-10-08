import { ChallengesInteractive } from "@/components/challenges/challenges-interactive";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { DiscoverInteractive } from "@/components/discover/discover-interactive";
import { fetchChallengesForUser } from "@/lib/data/challenges";
import { fetchDiscoverSections } from "@/lib/data/discover";
import { fetchChallengeMessages } from "@/lib/data/messages";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Challenges",
};

export default async function ChallengesPage() {
  const { user, profile } = await getCurrentUserProfile();
  const userId = user?.id ?? null;
  const viewerName =
    profile?.displayName?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "Member";

  const [{ mine }, discoverSections] = await Promise.all([
    fetchChallengesForUser(userId),
    fetchDiscoverSections(),
  ]);

  const challengeMessages: Record<string, Awaited<ReturnType<typeof fetchChallengeMessages>>> = {};
  for (const c of mine) {
    challengeMessages[c.id] = await fetchChallengeMessages(c.id);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Challenges"
        subtitle="Search free creator challenges · join in one tap"
      />
      <div className="space-y-6 px-4 py-4">
        <DiscoverInteractive
          initial={discoverSections}
          variant="embedded"
          viewerUserId={userId}
          joinedChallengeIds={mine.map((c) => c.id)}
        />

        <Link
          href="/challenges/create"
          className="block rounded-2xl border border-dashed border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-primary"
        >
          + Create private invite-only challenge
        </Link>

        {profile?.role === "creator" || profile?.role === "admin" ? (
          <Link
            href="/studio/challenges"
            className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-secondary/40 px-4 text-sm font-semibold text-primary"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Add photos to your public challenges
          </Link>
        ) : null}

        <Card className="border-primary/20 bg-secondary/30">
          <div className="flex gap-3">
            <GiftIcon />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">100% free at launch</p>
              <p className="mt-1">
                Creators host public challenges from Creator Studio. Every
                challenge has a unique invite link.
              </p>
            </div>
          </div>
        </Card>

        <ChallengesInteractive
          mine={mine}
          viewerName={viewerName}
          loggedIn={Boolean(userId)}
          viewerUserId={userId}
          challengeMessages={challengeMessages}
        />
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
