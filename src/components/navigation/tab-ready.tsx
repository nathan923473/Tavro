"use client";

import { useEffect, type ReactNode } from "react";
import type { MainTab } from "@/components/navigation/instant-tab-host";

/** Signals that this tab's real content mounted (not a loading skeleton). */
export function TabReady({
  tab,
  children,
}: {
  tab: MainTab;
  children: ReactNode;
}) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("tavro-tab-ready", { detail: tab }));
  }, [tab]);

  return children;
}
