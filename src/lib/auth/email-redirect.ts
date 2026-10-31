import { canonicalAuthOrigin, safeInternalPath } from "@/lib/site-url";
import { headers } from "next/headers";

/** Allowlisted origin for Supabase confirmation, recovery, and re-verification links. */
export async function authEmailRedirect(nextPath: string): Promise<string> {
  const headerStore = await headers();
  const origin = canonicalAuthOrigin({
    host: headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
    protocol: headerStore.get("x-forwarded-proto"),
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
  const next = safeInternalPath(nextPath);
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
