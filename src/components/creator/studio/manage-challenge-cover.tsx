"use client";

import { ChallengeCoverField } from "@/components/challenges/challenge-cover-field";
import { Card } from "@/components/ui/card";
import { useState } from "react";

export function ManageChallengeCover({
  challengeId,
  initialCoverUrl,
  title,
  coverRequired = false,
}: {
  challengeId: string;
  initialCoverUrl: string | null;
  title: string;
  coverRequired?: boolean;
}) {
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);

  return (
    <Card className="space-y-2">
      <ChallengeCoverField
        challengeId={challengeId}
        coverUrl={coverUrl}
        title={title}
        required={coverRequired}
        onCoverUrlChange={setCoverUrl}
      />
    </Card>
  );
}
