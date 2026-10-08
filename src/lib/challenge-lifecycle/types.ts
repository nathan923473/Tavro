import type { ChallengePhase } from "@/lib/timezone/challenge-calendar";

export type PublishedLifecyclePhase = ChallengePhase;

export type CreatorChallengeWindow = {
  id: string;
  title: string;
  publishStatus: string;
  startAt: Date;
  endAtExclusive: Date;
  phase: PublishedLifecyclePhase;
};
