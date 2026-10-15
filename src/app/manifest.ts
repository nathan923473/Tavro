import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE, BRAND_COLORS } from "@/lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — Fitness challenges & accountability`,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLORS.white,
    theme_color: BRAND_COLORS.royalBlue,
    orientation: "portrait-primary",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
