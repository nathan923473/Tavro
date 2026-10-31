import { createAdminClient } from "@/lib/supabase/admin";

export const AUTH_RATE_LIMITS = {
  "signup:ip": { limit: 5, windowSeconds: 60 * 60 },
  "login:ip": { limit: 20, windowSeconds: 15 * 60 },
  "login:email": { limit: 10, windowSeconds: 15 * 60 },
  "resend:email": { limit: 3, windowSeconds: 60 * 60 },
  "reverify:email": { limit: 3, windowSeconds: 60 * 60 },
  "reset:email": { limit: 3, windowSeconds: 60 * 60 },
} as const;

export type AuthRateBucket = keyof typeof AUTH_RATE_LIMITS;
export type RateLimitResult = "ok" | "limited" | "unavailable";

export function clientIpFromHeaders(headerStore: {
  get(name: string): string | null;
}): string {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = headerStore.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return "unknown";
}

export async function consumeAuthRateLimit(
  bucket: AuthRateBucket,
  subject: string,
): Promise<RateLimitResult> {
  const admin = createAdminClient();
  if (!admin) return "unavailable";

  const rule = AUTH_RATE_LIMITS[bucket];
  const { data, error } = await admin.rpc("consume_auth_rate_limit", {
    p_bucket: bucket,
    p_subject: subject,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });

  if (error || typeof data !== "boolean") return "unavailable";
  return data ? "ok" : "limited";
}

export async function consumeAuthRateLimits(
  checks: { bucket: AuthRateBucket; subject: string }[],
): Promise<RateLimitResult> {
  let sawUnavailable = false;
  for (const check of checks) {
    const result = await consumeAuthRateLimit(check.bucket, check.subject);
    if (result === "limited") return "limited";
    if (result === "unavailable") sawUnavailable = true;
  }
  return sawUnavailable ? "unavailable" : "ok";
}
