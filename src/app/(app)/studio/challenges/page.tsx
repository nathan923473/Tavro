import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCreatorStudioChallenges } from "@/lib/data/creator-studio";
import type { StudioChallengeBucket } from "@/types/creator-studio";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Studio challenges" };

const BUCKETS: { key: StudioChallengeBucket; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "drafts", label: "Drafts" },
  { key: "completed", label: "Completed" },
];

export default async function StudioChallengesPage() {
  const { user } = await requireApprovedCreator();
  const challenges = await fetchCreatorStudioChallenges(user.id);

  return (
    <StudioLayout title="Challenges" subtitle="Active, upcoming, drafts, and completed">
      <Link
        href="/studio/challenges/new"
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
      >
        <PlusCircle className="h-4 w-4" aria-hidden />
        Create challenge
      </Link>

      {BUCKETS.map(({ key, label }) => {
        const list = challenges.filter((c) => c.bucket === key);
        if (!list.length) return null;
        return (
          <section key={key} aria-labelledby={`bucket-${key}`}>
            <h2 id={`bucket-${key}`} className="mb-2 text-base font-semibold">
              {label}
            </h2>
            <ul className="space-y-2">
              {list.map((c) => (
                <li key={c.id}>
                  <Card padding="sm" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.participantCount} participants · {c.startDate} → {c.endDate}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {c.publishStatus !== "draft" ? (
                        <Link
                          href={`/challenges/${c.id}`}
                          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                        >
                          Open challenge
                        </Link>
                      ) : null}
                      <Link
                        href={`/studio/challenges/${c.id}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold text-primary"
                      >
                        Manage
                      </Link>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {challenges.length === 0 ? (
        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">No challenges yet.</p>
        </Card>
      ) : null}

      <Link
        href="/studio/challenges/photos"
        className="block text-center text-sm text-primary"
      >
        Challenge cover & gallery photos →
      </Link>
    </StudioLayout>
  );
}
