export const CHALLENGE_COVER_REQUIRED_MESSAGE =
  "Add a challenge cover image before publishing. Upload a JPG, PNG, or WebP (Studio → cover on the challenge, or the builder goal step).";

export function challengeHasCover(coverUrl: string | null | undefined): boolean {
  return typeof coverUrl === "string" && coverUrl.trim().length > 0;
}
