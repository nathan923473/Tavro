import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCreatorChallenges } from "@/lib/data/creator-challenges";
import { ImageIcon } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Challenge photos" };

export default async function StudioChallengesPage() {
  const { user } = await requireApprovedCreator();
  const challenges = await fetchCreatorChallenges(user.id);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Challenge photos"
        subtitle="Cover images and galleries on public invite pages"
      />
      <div className="space-y-3 px-4 py-4">
        {challenges.length === 0 ? (
          <Card className="border-dashed">
            <p className="text-sm text-muted-foreground">
              Publish a public challenge first, then add photos here.
            </p>
            <Link
              href="/studio/challenges/new"
              className="mt-2 inline-block text-sm font-semibold text-primary"
            >
              Create public challenge →
            </Link>
          </Card>
        ) : (
          <ul className="space-y-2">
            {challenges.map((c) => (
              <li key={c.id}>
                <Link href={`/studio/challenges/${c.id}/photos`}>
                  <Card padding="sm" className="flex items-center gap-3">
                    <div className="rounded-xl bg-muted p-2 text-muted-foreground">
                      <ImageIcon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.visibility === "public" ? "Public" : "Private"} · /join/
                        {c.invite_slug}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {c.cover_url ? "Edit photos" : "Add photos"}
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/studio" className="block text-center text-sm text-primary">
          ← Back to Studio
        </Link>
      </div>
    </div>
  );
}
