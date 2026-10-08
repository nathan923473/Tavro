"use server";

import {
  mergeAttributionCookie,
  recordChallengeLandingView,
} from "@/lib/analytics/attribution";
import type { SignupAcquisitionSource } from "@/lib/analytics/constants";

export async function primeChallengeAttributionAction(input: {
  creatorId: string;
  challengeId: string;
  landingPath: string;
  referralCode?: string | null;
}) {
  await mergeAttributionCookie({
    creatorId: input.creatorId,
    challengeId: input.challengeId,
    landingPath: input.landingPath,
    referralCode: input.referralCode ?? undefined,
    source: "creator_link" satisfies SignupAcquisitionSource,
  });
}

export async function primeReferralAttributionAction(referralCode: string) {
  await mergeAttributionCookie({
    referralCode,
    source: "participant_referral",
  });
}

export async function recordChallengeLandingViewAction(input: {
  challengeId: string;
  creatorId: string;
  communityId?: string | null;
  landingPath: string;
}) {
  await recordChallengeLandingView(input);
}
