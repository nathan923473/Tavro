export type AvatarPreset = {
  id: string;
  label: string;
  gradient: string;
  emoji: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "1", label: "Royal", gradient: "linear-gradient(135deg,#3156E8,#2442c4)", emoji: "⚡" },
  { id: "2", label: "Ocean", gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)", emoji: "🌊" },
  { id: "3", label: "Sunset", gradient: "linear-gradient(135deg,#f97316,#db2777)", emoji: "🌅" },
  { id: "4", label: "Lavender", gradient: "linear-gradient(135deg,#a78bfa,#7c3aed)", emoji: "✨" },
  { id: "5", label: "Slate", gradient: "linear-gradient(135deg,#64748b,#334155)", emoji: "🏔️" },
  { id: "6", label: "Citrus", gradient: "linear-gradient(135deg,#84cc16,#ca8a04)", emoji: "🍋" },
];

export function presetAvatarValue(presetId: string) {
  return `preset:${presetId}`;
}

export function parsePresetAvatar(url: string | null | undefined) {
  if (!url?.startsWith("preset:")) return null;
  const id = url.slice("preset:".length);
  return AVATAR_PRESETS.find((p) => p.id === id) ?? null;
}

export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const CHALLENGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export function extensionForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}
