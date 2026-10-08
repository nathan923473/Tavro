"use client";

import { TAB_HINT_COOKIE } from "@/lib/auth/tab-session";

const TAB_STORAGE_KEY = "tavro_tab_id";

export function getOrCreateTabId(): string {
  if (typeof window === "undefined") {
    return "00000000-0000-4000-8000-000000000000";
  }
  let id = sessionStorage.getItem(TAB_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(TAB_STORAGE_KEY, id);
  }
  return id;
}

/** Tell the server which tab's auth cookies to read (refreshed when this tab is focused). */
export function syncTabHintCookie(tabId = getOrCreateTabId()) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:";
  document.cookie = `${TAB_HINT_COOKIE}=${encodeURIComponent(tabId)}; path=/; SameSite=Lax; max-age=31536000${secure ? "; Secure" : ""}`;
}
