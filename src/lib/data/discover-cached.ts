import { unstable_cache } from "next/cache";
import { fetchDiscoverSections } from "@/lib/data/discover";

/** Public discover lists — cookie-free fetch, safe to cache across requests. */
export const fetchDiscoverSectionsCached = unstable_cache(
  () => fetchDiscoverSections(),
  ["tavro-discover-sections-v2"],
  { revalidate: 120, tags: ["discover-sections"] },
);
