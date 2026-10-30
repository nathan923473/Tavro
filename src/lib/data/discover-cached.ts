import { unstable_cache } from "next/cache";
import { fetchDiscoverSections } from "@/lib/data/discover";

/** Public discover lists — safe to cache (no user-specific rows). */
export const fetchDiscoverSectionsCached = unstable_cache(
  () => fetchDiscoverSections(),
  ["tavro-discover-sections"],
  { revalidate: 120, tags: ["discover-sections"] },
);
