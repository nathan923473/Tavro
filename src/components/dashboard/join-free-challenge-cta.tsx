import { Trophy } from "lucide-react";
import Link from "next/link";

/** Home entry point to browse and join public challenges. */
export function JoinFreeChallengeCta() {
  return (
    <Link
      href="/challenges"
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95 active:opacity-90"
    >
      <Trophy className="h-5 w-5 shrink-0" aria-hidden />
      Join a free challenge
    </Link>
  );
}
