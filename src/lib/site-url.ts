/** Base URL for share links (set in production via env). */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://streakly.app";
}

export function challengeInvitePath(slug: string): string {
  return `/join/${slug}`;
}

export function publicChallengePath(communitySlug: string, inviteSlug: string): string {
  return `/creator/${communitySlug}/challenges/${inviteSlug}`;
}

export function groupInvitePath(code: string): string {
  return `/invite/group/${code}`;
}

export function creatorInvitePath(token: string): string {
  return `/invite/creator/${token}`;
}

/** Relative in-app path only. Rejects protocol-relative and absolute URLs. */
export function safeInternalPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed || trimmed.length > 512) return fallback;
  let value = trimmed;
  try {
    value = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("://") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }
  return value;
}

const TAVRO_PRODUCTION_ORIGIN = "https://www.jointavro.app";

function hostnameOf(host: string): string {
  const trimmed = host.trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    return end === -1 ? trimmed : trimmed.slice(0, end + 1);
  }
  return trimmed.split(":")[0] ?? "";
}

/**
 * Origin used in Supabase email links.
 * jointavro.app and www.jointavro.app always become https://www.jointavro.app.
 * Other hosts are accepted only when they match NEXT_PUBLIC_APP_URL, or localhost in development.
 */
export function canonicalAuthOrigin(input: {
  host?: string | null;
  protocol?: string | null;
  nodeEnv?: string;
  appUrl?: string | null;
}): string {
  const host = input.host?.trim() ?? "";
  const hostname = hostnameOf(host);
  if (hostname === "jointavro.app" || hostname === "www.jointavro.app") {
    return TAVRO_PRODUCTION_ORIGIN;
  }

  const appUrl = input.appUrl?.replace(/\/$/, "");
  if (appUrl && hostname) {
    try {
      const allowed = new URL(appUrl);
      if (hostname === allowed.hostname.toLowerCase()) {
        return `${allowed.protocol}//${allowed.host}`;
      }
    } catch {
      /* ignore an invalid app url */
    }
  }

  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV;
  if (nodeEnv !== "production" && (hostname === "localhost" || hostname === "127.0.0.1")) {
    const protocol = input.protocol === "https:" || input.protocol === "https" ? "https:" : "http:";
    return `${protocol}//${host}`;
  }

  return TAVRO_PRODUCTION_ORIGIN;
}

export function userReferralPath(code: string): string {
  return `/welcome?ref=${code}`;
}
