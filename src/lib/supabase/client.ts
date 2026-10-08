"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getOrCreateTabId } from "@/lib/auth/tab-id.client";
import { supabaseAuthCookieOptions } from "@/lib/auth/tab-session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  const tabId = typeof window !== "undefined" ? getOrCreateTabId() : null;
  const cookieOptions = supabaseAuthCookieOptions(url, tabId);

  return createBrowserClient(url, anonKey, {
    ...(cookieOptions ? { cookieOptions } : {}),
    isSingleton: false,
  });
}

export function tryCreateClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient();
}
