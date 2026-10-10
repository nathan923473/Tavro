import { createServerClient } from "@supabase/ssr";
import {
  TAB_HINT_COOKIE,
  TAB_ID_HEADER,
  defaultSupabaseAuthStorageKey,
  sanitizeTabId,
  supabaseAuthCookieOptions,
  supabaseAuthStorageKeyForTab,
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

  const supabaseUrl = url;
  const supabaseAnonKey = anonKey;

  const tabId = resolveTabId(request);
  const cookieOptions = supabaseAuthCookieOptions(supabaseUrl, tabId);

  function buildClient(options: { name: string } | undefined) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      ...(options ? { cookieOptions: options } : {}),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Parameters<typeof supabaseResponse.cookies.set>[2];
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options: cookieOpts }) => {
            supabaseResponse.cookies.set(name, value, cookieOpts);
          });
        },
      },
    });
  }

  const supabase = buildClient(cookieOptions);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && tabId) {
    const tabKey = supabaseAuthStorageKeyForTab(supabaseUrl, tabId);
    const defaultKey = defaultSupabaseAuthStorageKey(supabaseUrl);
    const hasTabCookies = request.cookies
      .getAll()
      .some((c) => c.name.startsWith(tabKey));
    const hasDefaultCookies = request.cookies
      .getAll()
      .some((c) => c.name.startsWith(defaultKey));

    if (hasDefaultCookies && !hasTabCookies) {
      const legacy = buildClient({ name: defaultKey });
      await legacy.auth.getUser();
    }
  }

  return supabaseResponse;
}
