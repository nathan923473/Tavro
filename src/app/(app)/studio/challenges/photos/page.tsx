import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCreatorChallenges } from "@/lib/data/creator-challenges";
import { ImageIcon } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Challenge photos" };

export default async function StudioChallengePhotosPage() {
  const { user } = await requireApprovedCreator();
  const challenges = await fetchCreatorChallenges(user.id);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Challenge photos"
        subtitle="Cover images and galleries on invite pages"
        backHref="/studio/challenges"
      />
      <div className="space-y-3 px-4 py-4">
        {challenges.length === 0 ? (
          <Card className="border-dashed">
            <p className="text-sm text-muted-foreground">
              Create a challenge first, then add photos here.
            </p>
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
                      <p className="text-xs text-muted-foreground">/join/{c.invite_slug}</p>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
