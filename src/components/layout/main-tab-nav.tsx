"use client";

import {
  mainTabFromPath,
  useInstantTabNavigate,
  type MainTab,
} from "@/components/navigation/instant-tab-host";
import {
  ACCOUNTABILITY_GROUP_NAV,
  ACCOUNTABILITY_GROUP_PLURAL,
} from "@/lib/copy/accountability-groups";
import { Home, Trophy, TrendingUp, UserRound, Users } from "lucide-react";
import type { MouseEvent } from "react";

export const mainTabs = [
  { href: "/", label: "Home", icon: Home },
  {
    href: "/groups",
    label: ACCOUNTABILITY_GROUP_NAV,
    icon: Users,
    title: ACCOUNTABILITY_GROUP_PLURAL,
  },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const satisfies ReadonlyArray<{
  href: MainTab;
  label: string;
  icon: typeof Home;
  title?: string;
}>;

export function isMainTabActive(pathname: string, href: MainTab) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function useMainTabClick(href: MainTab) {
  const instantNavigate = useInstantTabNavigate();

  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    const tab = mainTabFromPath(href);
    if (!tab || !instantNavigate) return;
    event.preventDefault();
    instantNavigate(tab);
  };
}
