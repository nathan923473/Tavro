import {
  BarChart3,
  LayoutGrid,
  Link2,
  Settings,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export type StudioTab = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const studioTabs: readonly StudioTab[] = [
  { href: "/studio", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/studio/challenges", label: "Challenges", icon: Trophy },
  { href: "/studio/community", label: "Community", icon: Users },
  { href: "/studio/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/studio/shop", label: "Shop & Links", icon: Link2 },
  { href: "/studio/settings", label: "Profile", icon: Settings },
];

export function isStudioTabActive(pathname: string, tab: StudioTab) {
  if (tab.exact) return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}
