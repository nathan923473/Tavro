import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** POST after client sign-in so profile exists even without DB trigger. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  let displayName: string | undefined;
  try {
    const body = (await request.json()) as { displayName?: string };
    displayName = body.displayName;
  } catch {
    /* empty body ok */
  }

  await ensureUserProfile(displayName);
  if (user.email_confirmed_at) {
    const { applySignupAttribution } = await import("@/lib/analytics/attribution");
    await applySignupAttribution(user.id);
  }
  return NextResponse.json({ ok: true });
}
