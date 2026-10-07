/** Prefer community avatar; fall back to the creator's profile photo. */
export function resolveCreatorAvatarUrl(
  communityAvatarUrl: string | null | undefined,
  profileAvatarUrl: string | null | undefined,
): string | null {
  const community = communityAvatarUrl?.trim();
  if (community) return community;
  const profile = profileAvatarUrl?.trim();
  if (profile) return profile;
  return null;
}
