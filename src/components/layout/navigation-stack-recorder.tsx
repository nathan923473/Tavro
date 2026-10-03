"use client";

import { recordNavPathname } from "@/lib/navigation-stack";
import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

/** Tracks in-app navigation so Back returns to the previous screen. */
export function NavigationStackRecorder() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (pathname) recordNavPathname(pathname);
  }, [pathname]);

  return null;
}
