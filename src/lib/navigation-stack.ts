const STACK_KEY = "streakly-nav-stack-v1";
const SKIP_PUSH_KEY = "streakly-nav-skip-push";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function readNavStack(): string[] {
  if (!canUseStorage()) return [];
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((p): p is string => typeof p === "string")
      : [];
  } catch {
    return [];
  }
}

function writeNavStack(stack: string[]) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-40)));
}

export function markSkipNextNavPush() {
  if (!canUseStorage()) return;
  sessionStorage.setItem(SKIP_PUSH_KEY, "1");
}

function consumeSkipNextNavPush(): boolean {
  if (!canUseStorage()) return false;
  const skip = sessionStorage.getItem(SKIP_PUSH_KEY) === "1";
  if (skip) sessionStorage.removeItem(SKIP_PUSH_KEY);
  return skip;
}

/** Call on every in-app route change (client). */
export function recordNavPathname(pathname: string) {
  if (!pathname || !canUseStorage()) return;

  if (consumeSkipNextNavPush()) return;

  const stack = readNavStack();
  const last = stack[stack.length - 1];
  if (last === pathname) return;

  stack.push(pathname);
  writeNavStack(stack);
}

/** Previous in-app screen if we have history, else null. */
export function getPreviousNavPath(): string | null {
  const stack = readNavStack();
  if (stack.length >= 2) return stack[stack.length - 2] ?? null;
  return null;
}

/** Pop current route and return the screen to show. */
export function resolveBackNavigation(fallbackHref: string): string {
  const stack = readNavStack();
  if (stack.length >= 2) {
    stack.pop();
    const target = stack[stack.length - 1] ?? fallbackHref;
    writeNavStack(stack);
    markSkipNextNavPush();
    return target;
  }
  return fallbackHref;
}
