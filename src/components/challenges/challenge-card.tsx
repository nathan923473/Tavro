"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { ChallengeGroupChat } from "@/components/challenges/challenge-group-chat";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import { demoUser } from "@/lib/mock-data";
import { challengeInvitePath } from "@/lib/site-url";
import type { Challenge } from "@/types";
import { CalendarRange, Gift, Users } from "lucide-react";
import { useState } from "react";

type ChallengeCardProps = {
  challenge: Challenge;
  showShareLink?: boolean;
};

export function ChallengeCard({
  challenge: initialChallenge,
  showShareLink = false,
}: ChallengeCardProps) {
  const { mergeChallenge, joinChallenge, leaveChallenge, logChallengeActivity } =
    useDemoStore();
  const challenge = mergeChallenge(initialChallenge);
  const inviteUrl = challengeInvitePath(challenge.inviteSlug);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{challenge.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            with {challenge.creatorName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {challenge.joined ? (
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
      <div className="mt-2 flex flex-wrap gap-1.5">
        {challenge.focusAreas.map((area) => (
          <Badge key={area} tone="muted">
            {area}
          </Badge>
        ))}
      </div>
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
              <span className="font-semibold">
                {challenge.progressPercent}%
              </span>
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
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              logChallengeActivity(challenge.id);
              setMessage("Logged for today — nice work.");
            }}
          >
            Log today&apos;s activity
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              leaveChallenge(challenge.id);
              setMessage("You left this challenge.");
            }}
          >
            Leave challenge
          </Button>
          <ChallengeGroupChat
            challengeId={challenge.id}
            challengeTitle={challenge.title}
            viewerName={demoUser.firstName}
            viewerRole="member"
            canPost
            compact
          />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <Button
            fullWidth
            onClick={() => {
              joinChallenge(challenge.id);
              setMessage("You're in — check My challenges on Home.");
            }}
          >
            Join free challenge
          </Button>
          <CopyLinkButton url={inviteUrl} label="Share with a friend" fullWidth />
        </div>
      )}
      {message ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
