import { turnstileMode } from "@/lib/auth/email-verification";

type TurnstileEnv = {
  NODE_ENV?: string;
  TURNSTILE_SECRET_KEY?: string;
};

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string | null | undefined,
  ip: string,
  env: TurnstileEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (turnstileMode(env) === "skip") return { ok: true };

  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return {
      ok: false,
      message: "Sign-up protection is not configured yet. Try again after Turnstile is added.",
    };
  }
  if (!token?.trim()) {
    return { ok: false, message: "Complete the security check and try again." };
  }

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return { ok: false, message: "The security check could not be verified. Try again." };
    }
    const payload = (await response.json()) as { success?: boolean };
    if (!payload.success) {
      return {
        ok: false,
        message: "The security check failed. Refresh the page and try again.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "The security check could not be verified. Try again." };
  }
}
