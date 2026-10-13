import Link from "next/link";

/** Tasteful coach discovery link on public challenge pages. */
export function ChallengeCoachCta() {
  return (
    <p className="text-center text-xs text-muted-foreground">
      Are you a fitness coach?{" "}
      <Link href="/creators" className="font-medium text-primary underline-offset-2 hover:underline">
        Run your own challenge on Tavro
      </Link>
    </p>
  );
}
