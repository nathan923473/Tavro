import { fetchDiscoverSections } from "@/lib/data/discover";

/**
 * Discover sections (public data). Intentionally not wrapped in unstable_cache —
 * cached callbacks cannot use cookies()/createClient() safely on Vercel.
 */
export async function fetchDiscoverSectionsCached() {
  return fetchDiscoverSections();
}
