"use client";

import { Button } from "@/components/ui/button";
import { userFacingErrorMessage } from "@/lib/errors/user-message";
import Link from "next/link";

export default function CreatorCommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <h1 className="text-lg font-semibold">Couldn&apos;t load this community</h1>
      <p className="text-sm text-muted-foreground">
        This is usually a Supabase setup step missing on your project — not something
        you did wrong in the browser.
      </p>
      <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        {userFacingErrorMessage(error, "Something unexpected went wrong while loading this page.")}
      </p>
      <p className="text-sm text-muted-foreground">
        In Supabase → <strong>SQL Editor</strong>, run the whole file{" "}
        <code className="text-xs">supabase/scripts/fix-creator-community-page.sql</code>
        , then try again.
      </p>
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Link
          href="/challenges"
          className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
        >
          Back to Challenges
        </Link>
      </div>
    </div>
  );
}
