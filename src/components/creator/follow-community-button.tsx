"use client";

import { toggleFollowCommunityAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function FollowCommunityButton({
  communityId,
  initialFollowing,
  loggedIn,
}: {
  communityId: string;
  initialFollowing: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      fullWidth
      variant={initialFollowing ? "secondary" : undefined}
      disabled={pending || !loggedIn}
      onClick={() =>
        startTransition(async () => {
          await toggleFollowCommunityAction(communityId);
          router.refresh();
        })
      }
    >
      {!loggedIn
        ? "Log in to follow"
        : initialFollowing
          ? "Following ✓"
          : "Follow community"}
    </Button>
  );
}
