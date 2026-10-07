import { ChallengeTodayView } from "@/components/challenges/challenge-today-view";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchTodayChallengeView } from "@/lib/data/challenge-daily";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { user } = await getCurrentUserProfile();
  if (!user) return { title: "Today's challenge" };
  const view = await fetchTodayChallengeView(id, user.id);
  return { title: view ? `Day ${view.dayIndex} · ${view.title}` : "Challenge" };
}

export default async function ChallengeTodayPage({ params }: Props) {
  const { id } = await params;
  const { user } = await getCurrentUserProfile();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/challenges/${id}/today`)}`);

  const view = await fetchTodayChallengeView(id, user.id);
  if (!view) redirect("/challenges");

  return (
    <div className="animate-fade-up pb-6">
      <PageHeader title="Today" subtitle={view.title} />
      <div className="px-4 py-4">
        <ChallengeTodayView initial={view} />
      </div>
    </div>
  );
}
