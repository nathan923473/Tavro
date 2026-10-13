import { scoreChallengeForPreferences } from "@/lib/member/preferences";
import type { WorkTowards, GrowthFriction } from "@/lib/member/preferences";

type ScorableChallenge = {
  id: string;
  focusAreas?: string[];
  title?: string;
  shortDescription?: string | null;
};

export function sortChallengesByMemberPreferences<T extends ScorableChallenge>(
  challenges: T[],
  prefs: { workTowards: WorkTowards | null; growthFriction: GrowthFriction | null },
): T[] {
  if (!prefs.workTowards && !prefs.growthFriction) {
    return challenges;
  }
  return [...challenges].sort((a, b) => {
    const areasA = a.focusAreas?.length
      ? a.focusAreas
      : [a.title ?? "", a.shortDescription ?? ""];
    const areasB = b.focusAreas?.length
      ? b.focusAreas
      : [b.title ?? "", b.shortDescription ?? ""];
    const scoreA = scoreChallengeForPreferences(
      areasA,
      prefs.workTowards,
      prefs.growthFriction,
    );
    const scoreB = scoreChallengeForPreferences(
      areasB,
      prefs.workTowards,
      prefs.growthFriction,
    );
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.id.localeCompare(b.id);
  });
}
