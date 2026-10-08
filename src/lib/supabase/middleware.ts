import { createServerClient } from "@supabase/ssr";
import {
  TAB_HINT_COOKIE,
  TAB_ID_HEADER,
  sanitizeTabId,
  supabaseAuthCookieOptions,
} from "@/lib/auth/tab-session";
import { NextResponse, type NextRequest } from "next/server";

function resolveTabId(request: NextRequest): string | null {
  const fromHeader = sanitizeTabId(request.headers.get(TAB_ID_HEADER));
  if (fromHeader) return fromHeader;
  return sanitizeTabId(request.cookies.get(TAB_HINT_COOKIE)?.value ?? null);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const tabId = resolveTabId(request);
  const cookieOptions = supabaseAuthCookieOptions(url, tabId);

  const supabase = createServerClient(url, anonKey, {
    ...(cookieOptions ? { cookieOptions } : {}),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}
