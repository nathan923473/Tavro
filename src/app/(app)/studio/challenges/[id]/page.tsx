import {
  duplicateChallengeRedirectAction,
  publishChallengeFormAction,
} from "@/app/(app)/studio/actions";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import {
  creatorChallengePath,
  fetchChallengeSchedule,
  fetchCreatorStudioChallenges,
} from "@/lib/data/creator-studio";
import { fetchOwnerCommunity } from "@/lib/data/communities";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ManageChallengePage({ params }: Props) {
  const { id } = await params;
  const { user } = await requireApprovedCreator();
  const challenges = await fetchCreatorStudioChallenges(user.id);
  const challenge = challenges.find((c) => c.id === id);
  if (!challenge) notFound();

  const owner = await fetchOwnerCommunity(user.id);
  const schedule = await fetchChallengeSchedule(id);
  const sharePath =
    owner?.slug != null
      ? creatorChallengePath(owner.slug, challenge.inviteSlug)
      : `/join/${challenge.inviteSlug}`;

  const isCompleted = challenge.bucket === "completed";
  const isDraft = challenge.publishStatus === "draft";

  return (
    <StudioLayout title={challenge.title} subtitle="Manage · free challenge">
      <Card className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Status:</span> {challenge.bucket} (
          {challenge.publishStatus})
        </p>
        <p>
          <span className="font-medium">Participants:</span>{" "}
          {challenge.participantCount} total · {challenge.activeThisWeek} active this
          week
        </p>
        <p>
          <span className="font-medium">Dates:</span> {challenge.startDate} →{" "}
          {challenge.endDate}
        </p>
      </Card>

      {!isDraft ? (
        <CopyLinkButton url={sharePath} label="Copy challenge link" fullWidth />
      ) : null}

      <div className="grid gap-2">
        <Link
          href={`/studio/challenges/${id}/photos`}
          className="flex min-h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold"
        >
          Photos
        </Link>
        <Link
          href={`/studio/announcements?challenge=${id}`}
          className="flex min-h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold"
        >
          Post announcement
        </Link>
        <Link
          href="/studio/analytics"
          className="flex min-h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold"
        >
          View analytics
        </Link>
      </div>

      {schedule.length > 0 ? (
        <section>
          <h2 className="mb-2 text-base font-semibold">Schedule preview</h2>
          <ul className="space-y-1 text-sm">
            {schedule.slice(0, 8).map((s) => (
              <li key={s.id}>
                {s.dayLabel}: {s.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isCompleted ? (
        <Card className="border-primary/20 bg-secondary/30">
          <h2 className="font-semibold">Challenge complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thank your community with a completion announcement and invite them to follow
            you for the next free challenge.
          </p>
          <Link
            href="/studio/announcements"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            Post thank-you announcement →
          </Link>
        </Card>
      ) : null}

      {isDraft ? (
        <form action={publishChallengeFormAction.bind(null, id)}>
          <Button type="submit" fullWidth>
            Publish challenge
          </Button>
        </form>
      ) : null}

      <form action={duplicateChallengeRedirectAction.bind(null, id)}>
        <Button type="submit" variant="secondary" fullWidth>
          Duplicate as new draft
        </Button>
      </form>

      <Link href="/studio/challenges" className="block text-center text-sm text-primary">
        ← All challenges
      </Link>
    </StudioLayout>
  );
}
