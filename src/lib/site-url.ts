/** Base URL for share links (set in production via env). */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://steady.circle";
}

export function challengeInvitePath(slug: string): string {
  return `/join/${slug}`;
}

export function groupInvitePath(code: string): string {
  return `/invite/group/${code}`;
}

export function userReferralPath(code: string): string {
  return `/welcome?ref=${code}`;
}
