"use client";

import {
  joinChallengeAndContinueAction,
} from "@/app/(app)/member/actions";
import { ShareChallengeButton } from "@/components/share/share-challenge-button";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChallengeLandingData } from "@/lib/data/challenge-landing";
import { publicChallengePath } from "@/lib/site-url";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const { challenge } = data;
  const today = new Date().toISOString().slice(0, 10);
  const notStarted = challenge.startDate > today;
  const ended = challenge.endDate < today;

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
        {challenge.coverUrl ? (
          <div className="relative aspect-[2/1] w-full bg-muted">
            <Image src={challenge.coverUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {data.avatarUrl ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                <Image src={data.avatarUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                {data.communityName ?? challenge.creatorName}
              </p>
              <h1 className="text-xl font-semibold leading-snug">{challenge.title}</h1>
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
              {challenge.startDate} → {challenge.endDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" aria-hidden />
              {challenge.participants.toLocaleString()} joined
            </span>
          </div>

          {notStarted ? (
            <div className="mt-3 space-y-2">
              <ChallengeStartCountdown startDate={challenge.startDate} variant="hero" />
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
                <Link
                  href={
                    data.onboardingCompleted
                      ? `/challenges/${challenge.id}`
                      : joinContinuePath
                  }
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {data.onboardingCompleted ? "Open challenge" : "Finish setup"}
                </Link>
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

          {!data.joined ? (
            <div className="mt-4 grid gap-2 border-t border-border pt-4">
              <CopyLinkButton url={canonicalPath} label="Copy challenge link" fullWidth />
              <ShareChallengeButton
                path={canonicalPath}
                title={challenge.title}
                text={`Join ${challenge.title} — free on Streakly`}
                fullWidth
              />
            </div>
          ) : null}

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
          More from {data.communityName ?? challenge.creatorName} →
        </Link>
      ) : null}
    </div>
  );
}
