import { cn } from "@/lib/cn";
import { Trophy } from "lucide-react";
import Link from "next/link";

type JoinFreeChallengeCtaProps = {
  /** White button on the green welcome card */
  variant?: "default" | "onPrimary";
  className?: string;
};

/** Home entry point to browse and join public challenges. */
export function JoinFreeChallengeCta({
  variant = "default",
  className,
}: JoinFreeChallengeCtaProps) {
  return (
    <Link
      href="/challenges"
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl px-4 font-semibold shadow-sm transition-opacity hover:opacity-95 active:opacity-90",
        variant === "onPrimary"
          ? "mt-4 min-h-11 bg-white text-base text-primary"
          : "min-h-12 bg-primary text-base text-primary-foreground",
        className,
      )}
    >
      <Trophy className="h-5 w-5 shrink-0" aria-hidden />
      Join a free challenge
    </Link>
  );
}
