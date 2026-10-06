export type ChallengeChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  role: "creator" | "member";
  text: string;
  createdAt: string;
};
