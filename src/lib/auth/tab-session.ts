/** Per-tab Supabase sessions so multiple accounts can stay open in different tabs. */

export const TAB_ID_HEADER = "x-tavro-tab-id";

/** Non-httpOnly hint so Server Actions / document requests know which tab cookie to use. */
export const TAB_HINT_COOKIE = "tavro_tab_hint";

const TAB_ID_PATTERN = /^[0-9a-f-]{36}$/i;

export function sanitizeTabId(tabId: string | null | undefined): string | null {
  if (!tabId) return null;
  const trimmed = tabId.trim();
  return TAB_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function supabaseProjectRefFromUrl(supabaseUrl: string): string {
  try {
    const host = new URL(supabaseUrl).hostname;
    const ref = host.split(".")[0];
    return ref || "project";
  } catch {
    return "project";
  }
}

export function defaultSupabaseAuthStorageKey(supabaseUrl: string): string {
  return `sb-${supabaseProjectRefFromUrl(supabaseUrl)}-auth-token`;
}

export function supabaseAuthStorageKeyForTab(
  supabaseUrl: string,
  tabId: string,
): string {
  const safe = sanitizeTabId(tabId);
  if (!safe) return defaultSupabaseAuthStorageKey(supabaseUrl);
  return `sb-${supabaseProjectRefFromUrl(supabaseUrl)}-auth-token-tab-${safe}`;
}

export function supabaseAuthCookieOptions(
  supabaseUrl: string,
  tabId: string | null | undefined,
) {
  const safe = sanitizeTabId(tabId ?? null);
  if (!safe) return undefined;
  return { name: supabaseAuthStorageKeyForTab(supabaseUrl, safe) };
}
