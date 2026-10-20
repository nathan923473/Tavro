import { Card } from "@/components/ui/card";
import Link from "next/link";

export function ChallengeHubAccessDenied({
  reason,
  inviteSlug,
}: {
  reason: "not_found" | "not_joined" | "private" | "unknown";
  inviteSlug?: string | null;
}) {
  const message =
    reason === "not_found"
      ? "This challenge could not be found or you do not have access."
      : reason === "private"
        ? "This challenge is private. Only invited members can open it."
        : reason === "not_joined"
          ? "Join this challenge first, then open it from here."
          : "We could not open this challenge. Try joining again from the invite link.";

  return (
    <Card className="space-y-3">
      <h1 className="text-lg font-semibold">Can&apos;t open challenge</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex flex-col gap-2">
        {inviteSlug ? (
          <Link
            href={`/join/${inviteSlug}`}
            className="flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            View challenge & join
          </Link>
        ) : null}
        <Link
          href="/challenges"
          className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
        >
          Back to Challenges
        </Link>
      </div>
    </Card>
  );
}
