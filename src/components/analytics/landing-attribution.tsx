"use client";

import {
  primeChallengeAttributionAction,
  recordChallengeLandingViewAction,
} from "@/lib/analytics/actions";
import { useEffect, useRef } from "react";

/** One-shot landing attribution + page view (idempotent on server). */
export function LandingAttribution({
  challengeId,
  creatorId,
  communityId,
  landingPath,
  referralCode,
}: {
  challengeId: string;
  creatorId: string;
  communityId?: string | null;
  landingPath: string;
  referralCode?: string | null;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void (async () => {
      await primeChallengeAttributionAction({
        creatorId,
        challengeId,
        landingPath,
        referralCode,
      });
      await recordChallengeLandingViewAction({
        challengeId,
        creatorId,
        communityId,
        landingPath,
      });
    })();
  }, [challengeId, creatorId, communityId, landingPath, referralCode]);
  return null;
}
