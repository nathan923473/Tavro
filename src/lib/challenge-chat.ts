import { discoverChallenges, myChallenges } from "@/lib/mock-data";

export type ChallengeChatMessage = {
  id: string;
  authorName: string;
  role: "creator" | "member";
  text: string;
  createdAt: string;
};

const allChallenges = [...myChallenges, ...discoverChallenges];

export function getChallengeIdByInviteSlug(
  inviteSlug: string,
): string | undefined {
  return allChallenges.find((c) => c.inviteSlug === inviteSlug)?.id;
}

export function getChallengeTitleById(challengeId: string): string {
  return (
    allChallenges.find((c) => c.id === challengeId)?.title ?? "Challenge"
  );
}
