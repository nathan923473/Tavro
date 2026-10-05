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

/** Short destination name shown on back buttons. */
export function shortLabelForPath(pathname: string): string {
  if (pathname === "/") return "Home";

  const exact: Record<string, string> = {
    "/profile": "Profile",
    "/groups": "Private accountability groups",
    "/challenges": "Challenges",
    "/progress": "Progress",
    "/studio": "Creator Studio",
    "/creator/dashboard": "Creator dashboard",
    "/creator/analytics": "Analytics",
    "/following": "Following",
    "/become-creator": "Become a creator",
    "/challenges/create": "Create challenge",
    "/admin/creator-applications": "Admin",
    "/login": "Log in",
    "/signup": "Sign up",
    "/onboarding": "Get started",
  };
  if (exact[pathname]) return exact[pathname];

  const creatorPage = pathname.match(/^\/creator\/([^/]+)$/);
  if (creatorPage) return "Community";

  const editPage = pathname.match(/^\/creator\/([^/]+)\/edit$/);
  if (editPage) return "Edit community";

  const joinPage = pathname.match(/^\/join\/[^/]+$/);
  if (joinPage) return "Challenge invite";

  const invitePage = pathname.match(/^\/invite\/group\/[^/]+$/);
  if (invitePage) return "Private accountability group invite";

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return "Previous page";
  return last.replace(/-/g, " ");
}

export function backLabelForHref(href: string): string {
  return `Back to ${shortLabelForPath(href)}`;
}
