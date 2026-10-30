"use client";

import { ChallengeGroupChat } from "@/components/challenges/challenge-group-chat";
import {
  joinChallengeAction,
  logChallengeActivityAction,
} from "@/app/(app)/member/actions";
import { LeaveChallengeButton } from "@/components/challenges/leave-challenge-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import type { ChallengeChatMessage } from "@/lib/challenge-chat";
import { challengeInvitePath } from "@/lib/site-url";
import type { Challenge } from "@/types";
import { ReportContentMenu } from "@/components/moderation/report-content-menu";
import { ChallengeCreatorLine } from "@/components/challenges/challenge-creator-line";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeCoverImage } from "@/components/challenges/challenge-cover-image";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { isChallengeUpcoming } from "@/lib/challenge-countdown";
import { CalendarRange, Gift, Users } from "lucide-react";
import Image from "next/image";
import { OpenChallengeButton } from "@/components/challenges/open-challenge-button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ChallengeCardProps = {
  challenge: Challenge;
  showShareLink?: boolean;
  viewerName: string;
  viewerRole: "creator" | "member";
  messages?: ChallengeChatMessage[];
  /** Defer chat fetch until client mount (Challenges list page). */
  deferChatLoad?: boolean;
  loggedIn: boolean;
  viewerUserId?: string | null;
};

export function ChallengeCard({
  challenge,
  showShareLink = false,
  viewerName,
  viewerRole,
  messages = [],
  deferChatLoad = false,
  loggedIn,
  viewerUserId = null,
}: ChallengeCardProps) {
  const canReportMedia = Boolean(
    loggedIn && viewerUserId && viewerUserId !== challenge.creatorId && challenge.coverUrl,
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

  const upcoming = isChallengeUpcoming(challenge);

  return (
    <Card className="overflow-hidden p-0">
      <ChallengeCoverImage
        coverUrl={challenge.coverUrl}
        title={challenge.title}
        report={{
          contentId: challenge.id,
          reportedUserId: challenge.creatorId,
          canReport: canReportMedia,
        }}
      />
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {upcoming ? (
              <Badge tone="warning" className="uppercase tracking-wide">
                Upcoming
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {upcoming ? (
              <ChallengeStartCountdown
                startAt={challenge.startAt}
                startDate={challenge.startDate}
                challengeTimezone={challenge.challengeTimezone}
                variant="compact"
                label="Starts in"
              />
            ) : null}
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
        <div>
          <h2 className="font-semibold leading-snug">{challenge.title}</h2>
          <ChallengeCreatorLine
            displayName={challenge.creatorName}
            avatarUrl={challenge.creatorAvatarUrl}
            className="mt-1.5"
          />
        </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
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
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarRange className="h-3.5 w-3.5" aria-hidden />
          <ChallengeDateRange
            startDate={challenge.startDate}
            endDate={challenge.endDate}
            challengeTimezone={challenge.challengeTimezone}
          />
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
          <OpenChallengeButton challengeId={challenge.id} className="min-h-11">
            Open challenge
          </OpenChallengeButton>
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
            <LeaveChallengeButton
              challengeId={challenge.id}
              onStatus={setMessage}
            />
          ) : null}
          <ChallengeGroupChat
            challengeId={challenge.id}
            challengeTitle={challenge.title}
            viewerName={viewerName}
            viewerRole={viewerRole}
            canPost={loggedIn}
            messages={deferChatLoad ? undefined : messages}
            loadMessagesOnMount={deferChatLoad}
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
