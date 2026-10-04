const PRESET = /^preset:[1-6]$/;

export function isAllowedProfileAvatarUrl(url: string, supabaseUrl: string) {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  if (PRESET.test(trimmed)) return true;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const base = new URL(supabaseUrl);
    return (
      parsed.origin === base.origin &&
      parsed.pathname.includes("/storage/v1/object/public/avatars/")
    );
  } catch {
    return false;
  }
}

export function isAllowedPublicMediaUrl(
  url: string,
  supabaseUrl: string,
  bucket: "community-media" | "challenge-media",
) {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const base = new URL(supabaseUrl);
    return (
      parsed.origin === base.origin &&
      parsed.pathname.includes(
        `/storage/v1/object/public/${bucket}/`,
      )
    );
  } catch {
    return false;
  }
}
