import Link from "next/link";

/** Compact entry to Creator Studio — does not replace the daily accountability dashboard. */
export function HomeCreatorStudioShortcut() {
  return (
    <Link
      href="/studio"
      className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm transition-colors hover:bg-primary/10"
    >
      <span className="font-medium text-foreground">Creator Studio</span>
      <span className="shrink-0 text-xs font-semibold text-primary">Open →</span>
    </Link>
  );
}
