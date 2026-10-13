import { getAppBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export function challengeLandingMetadata(input: {
  title: string;
  description?: string | null;
  canonicalPath: string;
  coverUrl?: string | null;
}): Metadata {
  const description =
    input.description?.trim() ||
    `Join ${input.title} — free fitness challenge on Tavro.`;
  const url = `${getAppBaseUrl()}${input.canonicalPath.startsWith("/") ? input.canonicalPath : `/${input.canonicalPath}`}`;

  return {
    title: input.title,
    description,
    openGraph: {
      title: input.title,
      description,
      url,
      type: "website",
      ...(input.coverUrl ? { images: [{ url: input.coverUrl, alt: input.title }] } : {}),
    },
    twitter: {
      card: input.coverUrl ? "summary_large_image" : "summary",
      title: input.title,
      description,
      ...(input.coverUrl ? { images: [input.coverUrl] } : {}),
    },
  };
}
