"use client";

import { joinChallengeAndContinueAction } from "@/app/(app)/member/actions";
import { LeaveChallengeButton } from "@/components/challenges/leave-challenge-button";
import { ShareChallengeButton } from "@/components/share/share-challenge-button";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChallengeLandingData } from "@/lib/data/challenge-landing";
import { publicChallengePath } from "@/lib/site-url";
import { ChallengeCreatorLine } from "@/components/challenges/challenge-creator-line";
import { challengeCreatorSubtitle } from "@/lib/creator-display-name";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { LandingAttribution } from "@/components/analytics/landing-attribution";
import { ChallengeCoverImage } from "@/components/challenges/challenge-cover-image";
import { ChallengeCoachCta } from "@/components/challenges/challenge-coach-cta";
import { CalendarRange, Gift, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function authNextPath(path: string) {
  return `/login?next=${encodeURIComponent(path)}`;
}

export function ChallengeLandingView({
  data,
  loggedIn,
  canonicalPath,
  joinContinuePath,
}: {
  data: ChallengeLandingData;
  loggedIn: boolean;
  canonicalPath: string;
  joinContinuePath: string;
}) {
  const { challenge } = data;
  const creatorId = challenge.creatorId;
  return (
    <>
      {creatorId ? (
        <LandingAttribution
          challengeId={challenge.id}
          creatorId={creatorId}
          communityId={data.communityId}
          landingPath={canonicalPath}
        />
      ) : null}
      <ChallengeLandingBody
        data={data}
        loggedIn={loggedIn}
        canonicalPath={canonicalPath}
        joinContinuePath={joinContinuePath}
      />
    </>
  );
}

function ChallengeLandingBody({
  data,
  loggedIn,
  canonicalPath,
  joinContinuePath,
}: {
  data: ChallengeLandingData;
  loggedIn: boolean;
  canonicalPath: string;
  joinContinuePath: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const { challenge } = data;
  const notStarted =
    challenge.startAt != null
      ? new Date(challenge.startAt).getTime() > Date.now()
      : challenge.startDate > new Date().toISOString().slice(0, 10);
  const ended =
    challenge.endAt != null
      ? new Date(challenge.endAt).getTime() <= Date.now()
      : challenge.endDate < new Date().toISOString().slice(0, 10);

  function handleJoin() {
    if (!loggedIn) {
      router.push(authNextPath(joinContinuePath));
      return;
    }
    startTransition(async () => {
      try {
        const next = await joinChallengeAndContinueAction(challenge.id, joinContinuePath);
        router.push(next);
        router.refresh();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Could not join.");
      }
    });
  }

  if (!data.isLandingVisible && data.challenge) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          This challenge link is not available publicly. If you were invited privately, ask the
          host for an updated link.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.bannerUrl ? (
        <div className="relative -mx-4 h-36 overflow-hidden bg-muted">
          <Image src={data.bannerUrl} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <ChallengeCoverImage coverUrl={challenge.coverUrl} title={challenge.title} priority />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <ChallengeCreatorLine
                displayName={challenge.creatorName}
                avatarUrl={data.avatarUrl ?? challenge.creatorAvatarUrl}
                subtitle={
                  challengeCreatorSubtitle(
                    challenge.creatorName,
                    data.communityName,
                  ) ?? undefined
                }
              />
              <h1 className="mt-3 text-xl font-semibold leading-snug">{challenge.title}</h1>
            </div>
            <Badge tone="success" className="shrink-0 gap-1">
              <Gift className="h-3 w-3" aria-hidden />
              Free
            </Badge>
          </div>

          {data.shortDescription ? (
            <p className="mt-3 text-base font-medium">{data.shortDescription}</p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {challenge.description}
          </p>
          {data.goalDescription ? (
            <p className="mt-3 text-sm">
              <span className="font-medium">What you&apos;ll do: </span>
              {data.goalDescription}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="h-4 w-4" aria-hidden />
              <ChallengeDateRange
                startDate={challenge.startDate}
                endDate={challenge.endDate}
                challengeTimezone={challenge.challengeTimezone}
              />
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" aria-hidden />
              {challenge.participants.toLocaleString()} joined
            </span>
          </div>

          {notStarted ? (
            <div className="mt-3 space-y-2">
              <ChallengeStartCountdown
                startAt={challenge.startAt}
                startDate={challenge.startDate}
                challengeTimezone={challenge.challengeTimezone}
                variant="hero"
                showCreatorStart
              />
              <p className="text-sm text-muted-foreground">
                Join now — your spot is saved and activities unlock when the countdown ends.
              </p>
            </div>
          ) : null}
          {ended ? (
            <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
              This challenge has ended. You can still view details and follow the creator.
            </p>
          ) : null}

          <div className="mt-5 space-y-2">
            {data.joined ? (
              <>
                {notStarted ? (
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-3 py-3 text-center">
                    <p className="text-sm font-semibold text-primary">You&apos;re registered</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {challenge.participants.toLocaleString()} participants registered
                    </p>
                  </div>
                ) : null}
                <Link
                  href={
                    data.onboardingCompleted
                      ? `/challenges/${challenge.id}`
                      : joinContinuePath
                  }
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {notStarted
                    ? "View preparation"
                    : data.onboardingCompleted
                      ? "Open challenge"
                      : "Finish setup"}
                </Link>
                {!ended && data.joined && !data.isOwner ? (
                  <LeaveChallengeButton
                    challengeId={challenge.id}
                    label={notStarted ? "Withdraw before start" : "Leave challenge"}
                    redirectTo={
                      data.communitySlug
                        ? publicChallengePath(data.communitySlug, challenge.inviteSlug)
                        : `/join/${challenge.inviteSlug}`
                    }
                    onStatus={setStatus}
                  />
                ) : null}
                {data.communitySlug ? (
                  <Link
                    href={`/creator/${data.communitySlug}`}
                    className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold"
                  >
                    View creator community
                  </Link>
                ) : null}
              </>
            ) : (
              <Button type="button" fullWidth disabled={pending || ended} onClick={handleJoin}>
                {ended ? "Challenge ended" : "Join free"}
              </Button>
            )}
            {!loggedIn && !ended ? (
              <p className="text-center text-xs text-muted-foreground">
                <Link href={authNextPath(joinContinuePath)} className="font-medium text-primary">
                  Log in
                </Link>{" "}
                or join — takes under a minute.
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2 border-t border-border pt-4">
            <CopyLinkButton url={canonicalPath} label="Copy challenge link" fullWidth />
            <ShareChallengeButton
              path={canonicalPath}
              title={challenge.title}
              text={`Join ${challenge.title} — free on Tavro`}
              fullWidth
            />
          </div>

          {status ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {status}
            </p>
          ) : null}
        </div>
      </Card>

      {challenge.galleryPhotos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-1.5">
          {challenge.galleryPhotos.slice(0, 6).map((url) => (
            <li key={url} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
            </li>
          ))}
        </ul>
      ) : null}

      {data.communitySlug ? (
        <Link
          href={`/creator/${data.communitySlug}`}
          className="block text-center text-sm font-medium text-primary"
        >
          More from {challenge.creatorName} →
        </Link>
      ) : null}

      <ChallengeCoachCta />
    </div>
  );
}
