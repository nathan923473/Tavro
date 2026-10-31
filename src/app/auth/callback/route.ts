import { ownershipGateEnabled } from "@/lib/auth/email-verification";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { stampEmailOwnership } from "@/lib/auth/stamp-email-ownership";
import { canonicalAuthOrigin, safeInternalPath } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function linkErrorPath(next: string, expired: boolean): string {
  const code = expired ? "expired" : "invalid";
  if (next === "/reset-password") return `/forgot-password?error=${code}`;
  return `/verify-email?error=${code}`;
}

function isExpired(code: string | null, description: string | null, message?: string) {
  const haystack = `${code ?? ""} ${description ?? ""} ${message ?? ""}`.toLowerCase();
  return haystack.includes("otp_expired") || haystack.includes("expired");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const headerHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const origin = canonicalAuthOrigin({
    host: headerHost ?? requestUrl.host,
    protocol: forwardedProto ?? requestUrl.protocol,
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
  const browserHost = headerHost ?? requestUrl.host;
  const browserProtocol = (forwardedProto ?? requestUrl.protocol).replace(/:$/, "");
  const browserOrigin = `${browserProtocol}://${browserHost}`;
  if (browserOrigin !== origin) {
    return NextResponse.redirect(`${origin}${requestUrl.pathname}${requestUrl.search}`);
  }

  const next = safeInternalPath(requestUrl.searchParams.get("next"));
  const errorCode = requestUrl.searchParams.get("error_code") ?? requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  if (errorCode) {
    return NextResponse.redirect(
      `${origin}${linkErrorPath(next, isExpired(errorCode, errorDescription))}`,
    );
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}${linkErrorPath(next, false)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}${linkErrorPath(next, isExpired(null, null, error.message))}`,
    );
  }

  await ensureUserProfile();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    const stamp = await stampEmailOwnership(user.id);
    const { applySignupAttribution } = await import("@/lib/analytics/attribution");
    await applySignupAttribution(user.id);
    if (ownershipGateEnabled() && stamp === "failed") {
      return NextResponse.redirect(`${origin}/verify-email?error=config`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
