/** User-facing product name — use for titles, copy, and share text. */
export const APP_NAME = "Tavro";

export const APP_TAGLINE =
  "Fitness challenges and accountability that feel social, motivating, and free to join.";

/** Design tokens (mirror globals.css for non-CSS contexts). */
export const BRAND_COLORS = {
  royalBlue: "#3156E8",
  royalBlueDark: "#2442C4",
  mint: "#B8F4DA",
  white: "#FFFFFF",
  navy: "#1B2440",
} as const;

/** Default creator community accent when none is set. */
export const DEFAULT_CREATOR_BRAND_COLOR = BRAND_COLORS.royalBlue;

/** Swap `tavro-logo-source.png` and run `npm run icons` to refresh all derived assets. */
export const BRAND_LOGO = {
  sourcePath: "/branding/tavro-logo-source.png",
  markSm: "/branding/logo-mark-64.png",
  markMd: "/branding/logo-mark-128.png",
  markLg: "/branding/logo-mark-256.png",
  pwa192: "/icons/icon-192x192.png",
  pwa512: "/icons/icon-512x512.png",
  maskable512: "/icons/icon-maskable-512x512.png",
} as const;
