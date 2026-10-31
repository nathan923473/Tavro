"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RouteFallback } from "@/components/layout/route-fallback";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

export const MAIN_TABS = [
  "/",
  "/groups",
  "/challenges",
  "/progress",
  "/profile",
] as const;

export type MainTab = (typeof MAIN_TABS)[number];

const SHELL: Record<MainTab, { title: string; subtitle: string }> = {
  "/": { title: "Today", subtitle: "Habits, challenges & your crew" },
  "/groups": {
    title: "Private accountability groups",
    subtitle: "Member-only groups · not visible to creators",
  },
  "/challenges": {
    title: "Challenges",
    subtitle: "Search free creator challenges · join in one tap",
  },
  "/progress": {
    title: "Progress",
    subtitle: "Private habits & consistency · share wins if you want",
  },
  "/profile": { title: "Profile", subtitle: "Member or creator · one account" },
};

export function mainTabFromPath(path: string): MainTab | null {
  if (path === "/") return "/";
  if (
    path === "/groups" ||
    path === "/challenges" ||
    path === "/progress" ||
    path === "/profile"
  ) {
    return path;
  }
  return null;
}

type Navigate = (href: MainTab) => void;

const InstantNavContext = createContext<Navigate | null>(null);

export function useInstantTabNavigate(): Navigate | null {
  return useContext(InstantNavContext);
}

/**
 * Tab clicks paint a shell or the last ready screen before RSC finishes.
 * The in-memory cache is per browser tab and is cleared on sign-out routes.
 */
export function InstantTabHost({
  children,
  notificationSlot,
  creatorStudioSidebar,
}: {
  children: ReactNode;
  notificationSlot?: ReactNode;
  creatorStudioSidebar?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [optimistic, setOptimistic] = useState<MainTab | null>(null);
  const [cacheVersion, setCacheVersion] = useState(0);
  const settled = useRef<Partial<Record<MainTab, ReactNode>>>({});
  const liveChildren = useRef(children);
  const scrollY = useRef<Partial<Record<MainTab, number>>>({});
  liveChildren.current = children;

  const pathTab = mainTabFromPath(pathname);

  useEffect(() => {
    for (const href of MAIN_TABS) router.prefetch(href);
  }, [router]);

  useEffect(() => {
    function onReady(event: Event) {
      const tab = (event as CustomEvent<MainTab>).detail;
      if (!mainTabFromPath(tab)) return;
      settled.current[tab] = liveChildren.current;
      setOptimistic((current) => (current === tab ? null : current));
      setCacheVersion((n) => n + 1);
    }
    window.addEventListener("tavro-tab-ready", onReady);
    return () => window.removeEventListener("tavro-tab-ready", onReady);
  }, []);

  useEffect(() => {
    if (pathname === "/login" || pathname.startsWith("/auth/signout")) {
      settled.current = {};
      setCacheVersion((n) => n + 1);
    }
  }, [pathname]);

  useEffect(() => {
    if (optimistic && pathTab == null) setOptimistic(null);
  }, [optimistic, pathTab]);

  const navigate = useCallback(
    (href: MainTab) => {
      const current = optimistic ?? pathTab;
      if (current) scrollY.current[current] = window.scrollY;
      flushSync(() => setOptimistic(href));
      window.scrollTo(0, scrollY.current[href] ?? 0);
      router.push(href);
    },
    [optimistic, pathTab, router],
  );

  const active = optimistic ?? pathTab;
  const pending = optimistic != null;
  const cached = pending ? settled.current[optimistic] : null;

  const visible = !active ? (
    children
  ) : pending ? (
    cached ?? (
      <RouteFallback
        title={SHELL[optimistic].title}
        subtitle={SHELL[optimistic].subtitle}
      />
    )
  ) : (
    children
  );

  return (
    <InstantNavContext.Provider value={navigate}>
      <AppShell notificationSlot={notificationSlot} creatorStudioSidebar={creatorStudioSidebar}>
        {visible}
        {pending ? (
          <div hidden data-instant-live={cacheVersion}>
            {children}
          </div>
        ) : (
          <span className="sr-only" data-instant-live={cacheVersion} />
        )}
      </AppShell>
    </InstantNavContext.Provider>
  );
}
