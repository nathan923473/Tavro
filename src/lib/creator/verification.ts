/** Best-effort: fetch public profile HTML and look for verification code. */
export async function bioContainsVerificationCode(
  profileUrl: string,
  code: string,
): Promise<{ found: boolean; error?: string }> {
  const normalizedCode = code.trim().toUpperCase();
  let url: URL;
  try {
    url = new URL(profileUrl);
  } catch {
    return { found: false, error: "Invalid social profile URL." };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { found: false, error: "URL must use http or https." };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "StreaklyCreatorVerify/1.0 (+https://streakly.app; ownership-check)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        found: false,
        error: `Could not load profile page (${res.status}). Use DM verification or ask an admin to confirm.`,
      };
    }

    const html = (await res.text()).toUpperCase();
    const found =
      html.includes(normalizedCode) ||
      html.includes(normalizedCode.replace(/-/g, ""));

    return { found };
  } catch {
    return {
      found: false,
      error:
        "Automatic bio check failed (site may block bots). Use DM verification or admin manual confirm.",
    };
  }
}

export function getOfficialDmInstructions(): string {
  return (
    process.env.OFFICIAL_VERIFICATION_DM_TARGET?.trim() ||
    process.env.NEXT_PUBLIC_OFFICIAL_VERIFICATION_DM_TARGET?.trim() ||
    "@streaklyverify on Instagram"
  );
}
