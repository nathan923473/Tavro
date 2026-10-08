import type { ChallengePhase } from "@/lib/timezone/challenge-calendar";

export type RegistrationPolicy = {
  allowLateJoin: boolean;
  lateJoinUntil: Date | null;
  startAt: Date;
  endAtExclusive: Date;
  publishStatus: string;
  phase: ChallengePhase;
};

export type RegistrationDecision =
  | { allowed: true }
  | { allowed: false; reason: "draft" | "completed" | "closed" | "not_published" };

export function canRegisterForChallenge(
  policy: RegistrationPolicy,
  now: Date = new Date(),
): RegistrationDecision {
  if (policy.publishStatus === "draft") {
    return { allowed: false, reason: "draft" };
  }
  if (policy.publishStatus !== "published" && policy.publishStatus !== "scheduled") {
    return { allowed: false, reason: "not_published" };
  }
  if (policy.phase === "completed" || now.getTime() >= policy.endAtExclusive.getTime()) {
    return { allowed: false, reason: "completed" };
  }
  if (policy.phase === "upcoming") {
    return { allowed: true };
  }
  if (policy.phase === "active") {
    if (!policy.allowLateJoin) {
      return { allowed: false, reason: "closed" };
    }
    const cutoff = policy.lateJoinUntil ?? policy.endAtExclusive;
    if (now.getTime() >= cutoff.getTime()) {
      return { allowed: false, reason: "closed" };
    }
    return { allowed: true };
  }
  return { allowed: false, reason: "closed" };
}

export function registrationClosedMessage(
  reason: "draft" | "completed" | "closed" | "not_published",
): string {
  switch (reason) {
    case "completed":
      return "This challenge has ended. Registration is closed.";
    case "closed":
      return "Registration closed when this challenge started.";
    case "draft":
      return "This challenge is not open for registration yet.";
    case "not_published":
      return "This challenge is not available to join.";
    default:
      return "Registration is not available.";
  }
}
