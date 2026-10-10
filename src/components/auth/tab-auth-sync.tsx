"use client";

import {
  TAB_ID_HEADER,
  defaultSupabaseAuthStorageKey,
  supabaseAuthStorageKeyForTab,
  tabScopedAuthEnabled,
} from "@/lib/auth/tab-session";
import { getOrCreateTabId, syncTabHintCookie } from "@/lib/auth/tab-id.client";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

let fetchPatched = false;

function patchFetchWithTabId(tabId: string) {
  if (fetchPatched || typeof window === "undefined") return;
  fetchPatched = true;
  const original = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const nextInit: RequestInit = { ...(init ?? {}) };
    const headers = new Headers(nextInit.headers);
    headers.set(TAB_ID_HEADER, tabId);
    nextInit.headers = headers;
    return original(input, nextInit);
  };
}

async function migrateLegacySessionIfNeeded(tabId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return;

  if (!tabScopedAuthEnabled()) {
    const { createBrowserClient } = await import("@supabase/ssr");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) return;

    const defaultClient = createBrowserClient(url, anonKey, { isSingleton: false });
    const { data: defaultData } = await defaultClient.auth.getSession();
    if (defaultData.session) return;

    const tabKey = supabaseAuthStorageKeyForTab(url, tabId);
    const tabClient = createBrowserClient(url, anonKey, {
      cookieOptions: { name: tabKey },
      isSingleton: false,
    });
    const { data: tabData } = await tabClient.auth.getSession();
    if (tabData.session) {
      await defaultClient.auth.setSession(tabData.session);
    }
    return;
  }

  const tabClient = createClient();
  const { data: tabData } = await tabClient.auth.getSession();
  if (tabData.session) return;

  const { createBrowserClient } = await import("@supabase/ssr");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return;

  const legacyKey = defaultSupabaseAuthStorageKey(url);
  const tabKey = supabaseAuthStorageKeyForTab(url, tabId);
  if (legacyKey === tabKey) return;

  const legacyClient = createBrowserClient(url, anonKey, {
    cookieOptions: { name: legacyKey },
    isSingleton: false,
  });
  const { data: legacyData } = await legacyClient.auth.getSession();
  if (!legacyData.session) return;

  await tabClient.auth.setSession(legacyData.session);
}

/**
 * Keeps each browser tab on its own Supabase auth cookie and syncs the tab hint
 * when the user focuses this tab (so Server Actions use the right session).
 */
export function TabAuthSync() {
  useEffect(() => {
    const tabId = getOrCreateTabId();
    syncTabHintCookie(tabId);
    patchFetchWithTabId(tabId);

    const onFocus = () => syncTabHintCookie(tabId);
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncTabHintCookie(tabId);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    void migrateLegacySessionIfNeeded(tabId);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
