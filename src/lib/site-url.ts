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
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || next.includes("://")) {
    return fallback;
  }
  return next;
}

export function userReferralPath(code: string): string {
  return `/welcome?ref=${code}`;
}
