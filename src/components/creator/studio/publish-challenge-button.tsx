"use client";

import { publishChallengeFormAction } from "@/app/(app)/studio/actions";
import { Button } from "@/components/ui/button";
import {
  CHALLENGE_COVER_REQUIRED_MESSAGE,
  challengeHasCover,
} from "@/lib/challenge-lifecycle/cover-required";
import { useFormStatus } from "react-dom";

function SubmitButton({ hasCover }: { hasCover: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending || !hasCover}>
      Publish challenge
    </Button>
  );
}

export function PublishChallengeButton({
  challengeId,
  coverUrl,
}: {
  challengeId: string;
  coverUrl: string | null;
}) {
  const hasCover = challengeHasCover(coverUrl);

  return (
    <div className="space-y-2">
      <form action={publishChallengeFormAction.bind(null, challengeId)}>
        <SubmitButton hasCover={hasCover} />
      </form>
      {!hasCover ? (
        <p className="text-sm text-amber-800" role="status">
          {CHALLENGE_COVER_REQUIRED_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
