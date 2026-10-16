"use client";

import { Card } from "@/components/ui/card";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import type { ChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import { useEffect, useState } from "react";

const STORAGE_KEY = "tavro-challenge-glance-dismissed";

export function ChallengeAtAGlance({
  hub,
  onOpenAbout,
}: {
  hub: ChallengeParticipantHub;
  onOpenAbout: () => void;
}) {
  const storageId = `${STORAGE_KEY}-${hub.challengeId}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(sessionStorage.getItem(storageId) !== "1");
    } catch {
      setVisible(true);
    }
  }, [storageId]);

  if (!visible || (hub.phase !== "active" && hub.phase !== "upcoming")) return null;

  const goal =
    hub.goalDescription?.trim() ||
    hub.shortDescription?.trim() ||
    "Build consistent fitness habits with daily activities and support from your creator.";

  return (
    <Card className="space-y-2 border-[#3156E8]/20 bg-[#3156E8]/5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#1B2440]">Your challenge at a glance</h2>
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground"
          onClick={() => {
            try {
              sessionStorage.setItem(storageId, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
        >
          Dismiss
        </button>
      </div>
      <p className="text-sm text-muted-foreground">{goal}</p>
      <p className="text-xs text-muted-foreground">
        <ChallengeDateRange
          startDate={hub.startDate}
          endDate={hub.endDate}
          challengeTimezone={hub.challengeTimezone}
        />
        {" · "}
        {hub.totalDays} days
        {hub.phase === "upcoming" ? " · starts soon" : ` · Today is day ${hub.dayIndex}`}
      </p>
      <ul className="text-xs text-muted-foreground">
        <li>• Open <strong className="font-medium text-foreground">Today</strong> for activities (rest days included).</li>
        <li>• Track progress on the <strong className="font-medium text-foreground">Progress</strong> tab.</li>
        <li>• Creator updates live under <strong className="font-medium text-foreground">Updates</strong>.</li>
      </ul>
      <button
        type="button"
        className="text-xs font-semibold text-[#3156E8]"
        onClick={onOpenAbout}
      >
        Full challenge details →
      </button>
    </Card>
  );
}
