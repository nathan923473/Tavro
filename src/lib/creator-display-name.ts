/** Prefer profile display name; fall back to community title for legacy rows. */
export function creatorPublicName(
  ownerDisplayName: string | null | undefined,
  communityName: string,
): string {
  const owner = ownerDisplayName?.trim();
  if (owner) return owner;
  const community = communityName.trim();
  return community || "Creator";
}

const COMMUNITY_BRAND_TOKENS = new Set([
  "club",
  "team",
  "fitness",
  "fit",
  "health",
  "walking",
  "walk",
  "run",
  "running",
  "challenge",
  "challenges",
  "studio",
  "coach",
  "coaching",
  "squad",
  "crew",
  "lab",
  "labs",
  "life",
  "daily",
  "project",
  "official",
  "community",
  "wellness",
  "movement",
]);

/** Two-word names like "Nathan Stone" — often stale community titles, not brands. */
export function looksLikeFullPersonalName(name: string): boolean {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length !== 2) return false;
  if (!parts.every((part) => /^[A-Za-z][A-Za-z'-]*$/.test(part))) return false;
  return !parts.some((part) => COMMUNITY_BRAND_TOKENS.has(part.toLowerCase()));
}

/**
 * Community brand line for lists — hide when it is another personal name that
 * differs from the owner (e.g. old "Jack Smith" community + "Nathan Stone" profile).
 */
export function creatorCommunityBrandLabel(
  communityName: string,
  ownerDisplayName: string,
): string | null {
  const community = communityName.trim();
  const owner = ownerDisplayName.trim();
  if (!community || !owner) return null;
  if (community.toLowerCase() === owner.toLowerCase()) return null;
  if (
    looksLikeFullPersonalName(community) &&
    looksLikeFullPersonalName(owner)
  ) {
    return null;
  }
  return community;
}

/** Subtitle under creator name on challenge cards and landing pages. */
export function challengeCreatorSubtitle(
  creatorDisplayName: string,
  communityName: string | null | undefined,
): string | null {
  if (!communityName?.trim()) return null;
  return creatorCommunityBrandLabel(communityName, creatorDisplayName);
}
