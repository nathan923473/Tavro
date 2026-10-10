/**
 * Official Instagram handle shown for DM ownership verification.
 * Configure via env — do not invent a handle that Tavro does not own.
 */
export function getOfficialDmTarget(): string | null {
  const raw =
    process.env.OFFICIAL_VERIFICATION_DM_TARGET?.trim() ||
    process.env.NEXT_PUBLIC_OFFICIAL_VERIFICATION_DM_TARGET?.trim() ||
    "";
  return raw.length > 0 ? raw : null;
}

/** @deprecated Use getOfficialDmTarget */
export function getOfficialDmInstructions(): string {
  return getOfficialDmTarget() ?? "";
}
