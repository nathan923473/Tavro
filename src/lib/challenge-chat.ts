export type ChallengeChatMessage = {
  id: string;
  authorName: string;
  role: "creator" | "member";
  text: string;
  createdAt: string;
};
