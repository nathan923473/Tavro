/** Main bottom-tab routes — no back button on these. */
export const MAIN_TAB_PATHS = [
  "/",
  "/groups",
  "/challenges",
  "/progress",
  "/profile",
] as const;

const EXACT_BACK: Record<string, string> = {
  "/studio": "/profile",
  "/studio/challenges/new": "/studio",
  "/creator/dashboard": "/profile",
  "/creator/analytics": "/studio",
  "/following": "/challenges",
  "/become-creator": "/profile",
  "/challenges/create": "/challenges",
  "/admin/creator-applications": "/profile",
  "/login": "/",
  "/signup": "/",
  "/onboarding": "/",
  "/offline": "/",
};

export function isMainTabPath(pathname: string): boolean {
  return (MAIN_TAB_PATHS as readonly string[]).includes(pathname);
}

/** Parent route for in-app back navigation, or null when back should be hidden. */
export function getBackHref(pathname: string): string | null {
  if (isMainTabPath(pathname)) return null;

  if (EXACT_BACK[pathname]) return EXACT_BACK[pathname];

  const editMatch = pathname.match(/^\/creator\/([^/]+)\/edit$/);
  if (editMatch) return `/creator/${editMatch[1]}`;

  const creatorMatch = pathname.match(/^\/creator\/([^/]+)$/);
  if (creatorMatch) return "/challenges";

  const joinMatch = pathname.match(/^\/join\/[^/]+$/);
  if (joinMatch) return "/challenges";

  const inviteMatch = pathname.match(/^\/invite\/group\/[^/]+$/);
  if (inviteMatch) return "/groups";

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "/";
  segments.pop();
  return `/${segments.join("/")}`;
}

export function backLabelForHref(href: string): string {
  const labels: Record<string, string> = {
    "/": "Back to home",
    "/profile": "Back to profile",
    "/challenges": "Back to challenges",
    "/groups": "Back to groups",
    "/studio": "Back to Creator Studio",
  };
  return labels[href] ?? "Back";
}
