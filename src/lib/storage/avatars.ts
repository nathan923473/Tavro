export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const CHALLENGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** Challenge cover uploads — JPEG, PNG, WebP only. */
export const CHALLENGE_COVER_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function extensionForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}
