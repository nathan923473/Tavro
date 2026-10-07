"use client";

import { ChallengeGroupChat } from "@/components/challenges/challenge-group-chat";
import {
  joinChallengeAction,
  leaveChallengeAction,
  logChallengeActivityAction,
} from "@/app/(app)/member/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import type { ChallengeChatMessage } from "@/lib/challenge-chat";
import { challengeInvitePath } from "@/lib/site-url";
import type { Challenge } from "@/types";
import { ReportContentMenu } from "@/components/moderation/report-content-menu";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { isChallengeUpcoming } from "@/lib/challenge-countdown";
import { CalendarRange, Gift, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ChallengeCardProps = {
  challenge: Challenge;
  showShareLink?: boolean;
  viewerName: string;
  viewerRole: "creator" | "member";
  messages?: ChallengeChatMessage[];
  loggedIn: boolean;
  viewerUserId?: string | null;
};

export function ChallengeCard({
  challenge,
  showShareLink = false,
  viewerName,
  viewerRole,
  messages = [],
  loggedIn,
  viewerUserId = null,
}: ChallengeCardProps) {
  const canReportMedia = Boolean(
    loggedIn && viewerUserId && viewerUserId !== challenge.creatorId,
  );
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const inviteUrl = challengeInvitePath(challenge.inviteSlug);
  const isOwner = Boolean(viewerUserId && viewerUserId === challenge.creatorId);

  function run(action: () => Promise<void>, success: string) {
    startTransition(async () => {
      try {
        await action();
        setMessage(success);
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <Card className="overflow-hidden p-0">
      {challenge.coverUrl ? (
        <div className="relative aspect-[2/1] w-full bg-muted">
          <Image
            src={challenge.coverUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
          <ReportContentMenu
            contentType="challenge_cover"
            contentId={challenge.id}
            reportedUserId={challenge.creatorId}
            canReport={canReportMedia}
          />
        </div>
      ) : null}
      <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{challenge.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            with {challenge.creatorName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isOwner ? (
            <Badge tone="success">Your challenge</Badge>
          ) : challenge.joined ? (
            <Badge tone="success">Joined</Badge>
          ) : (
            <Badge tone="muted">Open</Badge>
          )}
          <Badge tone="default" className="gap-1">
            <Gift className="h-3 w-3" aria-hidden />
            Free
          </Badge>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {challenge.description}
      </p>
      {challenge.galleryPhotos.length > 0 ? (
        <ul className="mt-3 grid grid-cols-3 gap-1.5">
          {(challenge.galleryPhotoItems?.length
            ? challenge.galleryPhotoItems
            : challenge.galleryPhotos.map((url) => ({ id: url, imageUrl: url }))
          )
            .slice(0, 6)
            .map((photo) => (
            <li
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <Image src={photo.imageUrl} alt="" fill className="object-cover" unoptimized />
              {challenge.galleryPhotoItems ? (
                <ReportContentMenu
                  contentType="challenge_gallery_photo"
                  contentId={photo.id}
                  reportedUserId={challenge.creatorId}
                  canReport={canReportMedia}
                  className="right-1 top-1 scale-90"
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {challenge.focusAreas.map((area) => (
          <Badge key={area} tone="muted">
            {area}
          </Badge>
        ))}
      </div>
      {isChallengeUpcoming(challenge) ? (
        <ChallengeStartCountdown
          startAt={challenge.startAt}
          startDate={challenge.startDate}
          challengeTimezone={challenge.challengeTimezone}
          variant="prominent"
          className="mt-3"
          label="Starting in"
        />
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarRange className="h-3.5 w-3.5" aria-hidden />
          {challenge.startDate} → {challenge.endDate}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {challenge.participants.toLocaleString()} participating
        </span>
      </div>
      {challenge.joined ? (
        <div className="mt-4 space-y-3">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Your consistency</span>
              <span className="font-semibold">{challenge.progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${challenge.progressPercent}%` }}
              />
            </div>
          </div>
          {showShareLink ? (
            <CopyLinkButton
              url={inviteUrl}
              label="Copy challenge invite link"
              fullWidth
            />
          ) : null}
          <Link
            href={`/challenges/${challenge.id}`}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            Open challenge
          </Link>
          <Button
            variant="secondary"
            fullWidth
            disabled={pending || !loggedIn}
            onClick={() =>
              run(
                () => logChallengeActivityAction(challenge.id),
                "Logged for today — nice work.",
              )
            }
          >
            Quick log (legacy)
          </Button>
          {!isOwner ? (
            <Button
              variant="outline"
              fullWidth
              disabled={pending || !loggedIn}
              onClick={() =>
                run(
                  () => leaveChallengeAction(challenge.id),
                  "You left this challenge.",
                )
              }
            >
              Leave challenge
            </Button>
          ) : null}
          <ChallengeGroupChat
            challengeId={challenge.id}
            challengeTitle={challenge.title}
            viewerName={viewerName}
            viewerRole={viewerRole}
            canPost={loggedIn}
            messages={messages}
            compact
            viewerUserId={viewerUserId}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <Button
            fullWidth
            disabled={pending || !loggedIn}
            onClick={() =>
              run(
                () => joinChallengeAction(challenge.id),
                "You're in — check My challenges on Home.",
              )
            }
          >
            {loggedIn ? "Join free challenge" : "Log in to join"}
          </Button>
          <CopyLinkButton url={inviteUrl} label="Share with a friend" fullWidth />
        </div>
      )}
      {message ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
      </div>
    </Card>
  );
}
