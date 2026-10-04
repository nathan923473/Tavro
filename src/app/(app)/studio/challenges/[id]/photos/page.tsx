import { ChallengePhotosEditor } from "@/components/creator/challenge-photos-editor";
import { BackButton } from "@/components/layout/back-button";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCreatorChallengeForPhotos } from "@/lib/data/creator-challenges";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Photos · ${id.slice(0, 8)}` };
}

export default async function ChallengePhotosPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requireApprovedCreator();
  const data = await fetchCreatorChallengeForPhotos(user.id, id);

  if (!data) notFound();

  return (
    <div className="animate-fade-up px-4 py-4">
      <BackButton fallbackHref="/studio/challenges" />
      <Card className="mt-4">
        <ChallengePhotosEditor
          challengeId={data.challenge.id}
          creatorId={user.id}
          title={data.challenge.title}
          coverUrl={data.challenge.cover_url}
          photos={data.photos}
        />
      </Card>
    </div>
  );
}
