import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Streakly — Weight Loss Accountability",
    short_name: "Streakly",
    description:
      "Build sustainable habits with personal goals, accountability groups, and creator challenges.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f1",
    theme_color: "#3d8b6e",
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
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
