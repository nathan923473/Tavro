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

/** Refresh when the access token is missing, invalid, or within this window of expiry. */
const ACCESS_TOKEN_REFRESH_MARGIN_SEC = 90;

function resolveTabId(request: NextRequest): string | null {
  const fromHeader = sanitizeTabId(request.headers.get(TAB_ID_HEADER));
  if (fromHeader) return fromHeader;
  return sanitizeTabId(request.cookies.get(TAB_HINT_COOKIE)?.value ?? null);
}

function readAuthCookieRaw(
  request: NextRequest,
  storageKey: string,
): string | null {
  const single = request.cookies.get(storageKey)?.value;
  if (single) return single;

  const chunks: string[] = [];
  for (let i = 0; ; i++) {
    const part = request.cookies.get(`${storageKey}.${i}`)?.value;
    if (!part) break;
    chunks.push(part);
  }
  return chunks.length > 0 ? chunks.join("") : null;
}

/**
 * True when middleware should call Supabase Auth (network).
 * Pages still validate with getUser(); this only avoids a redundant Auth round-trip
 * on every soft navigation while the JWT is comfortably valid.
 */
export function middlewareShouldRefreshSession(
  request: NextRequest,
  supabaseUrl: string,
  tabId: string | null,
): boolean {
  const cookieOptions = supabaseAuthCookieOptions(supabaseUrl, tabId);
  const storageKey =
    cookieOptions?.name ?? defaultSupabaseAuthStorageKey(supabaseUrl);
  const raw = readAuthCookieRaw(request, storageKey);
  if (!raw) return true;

  try {
    let decoded = raw;
    if (raw.startsWith("base64-")) {
      const b64 = raw.slice("base64-".length).replace(/-/g, "+").replace(/_/g, "/");
      decoded = Buffer.from(b64, "base64").toString("utf8");
    } else {
      try {
        decoded = decodeURIComponent(raw);
      } catch {
        decoded = raw;
      }
    }
    const parsed = JSON.parse(decoded) as { expires_at?: number };
    if (typeof parsed.expires_at !== "number") return true;
    const secondsLeft = parsed.expires_at - Math.floor(Date.now() / 1000);
    return secondsLeft <= ACCESS_TOKEN_REFRESH_MARGIN_SEC;
  } catch {
    return true;
  }
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

  if (!middlewareShouldRefreshSession(request, supabaseUrl, tabId)) {
    return supabaseResponse;
  }

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
