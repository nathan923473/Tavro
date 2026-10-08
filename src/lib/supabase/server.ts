import { createServerClient } from "@supabase/ssr";
import {
  TAB_HINT_COOKIE,
  TAB_ID_HEADER,
  sanitizeTabId,
  supabaseAuthCookieOptions,
} from "@/lib/auth/tab-session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cookies, headers } from "next/headers";

async function resolveTabId(explicitTabId?: string | null): Promise<string | null> {
  const direct = sanitizeTabId(explicitTabId ?? null);
  if (direct) return direct;

  const headerStore = await headers();
  const fromHeader = sanitizeTabId(headerStore.get(TAB_ID_HEADER));
  if (fromHeader) return fromHeader;

  const cookieStore = await cookies();
  const fromHint = sanitizeTabId(
    cookieStore.get(TAB_HINT_COOKIE)?.value ?? null,
  );
  return fromHint;
}

export async function createClient(tabIdOverride?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  const tabId = await resolveTabId(tabIdOverride);
  const cookieOptions = supabaseAuthCookieOptions(url, tabId);
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    ...(cookieOptions ? { cookieOptions } : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* set from Server Component */
        }
      },
    },
  });
}

export async function checkSupabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      message: "Add Supabase URL and anon key to .env.local",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        configured: true,
        connected: false,
        message: error.message,
      };
    }
    return {
      configured: true,
      connected: true,
      message: "Connected to Supabase (auth ready)",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Connection failed";
    return {
      configured: true,
      connected: false,
      message,
    };
  }
}
