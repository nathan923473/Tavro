"use client";

import { TAB_HINT_COOKIE } from "@/lib/auth/tab-session";

const TAB_STORAGE_KEY = "tavro_tab_id";

function generateTabId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateTabId(): string {
  if (typeof window === "undefined") {
    return "00000000-0000-4000-8000-000000000000";
  }
  try {
    let id = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (!id) {
      id = generateTabId();
      sessionStorage.setItem(TAB_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return generateTabId();
  }
}

/** Tell the server which tab's auth cookies to read (refreshed when this tab is focused). */
export function syncTabHintCookie(tabId = getOrCreateTabId()) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:";
  document.cookie = `${TAB_HINT_COOKIE}=${encodeURIComponent(tabId)}; path=/; SameSite=Lax; max-age=31536000${secure ? "; Secure" : ""}`;
}
