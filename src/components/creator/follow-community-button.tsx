"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import { Bell, UserCheck, UserPlus } from "lucide-react";

type FollowCommunityButtonProps = {
  communitySlug: string;
  communityName: string;
  initiallyFollowing?: boolean;
  className?: string;
};

export function FollowCommunityButton({
  communitySlug,
  communityName,
  initiallyFollowing = false,
  className,
}: FollowCommunityButtonProps) {
  const { isFollowing, toggleFollow, state, hydrated } = useDemoStore();
  const following = hydrated
    ? isFollowing(communitySlug)
    : initiallyFollowing || state.followingSlugs.includes(communitySlug);

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        fullWidth
        variant={following ? "secondary" : "primary"}
        onClick={() => toggleFollow(communitySlug)}
      >
        {following ? (
          <UserCheck className="h-4 w-4" aria-hidden />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden />
        )}
        {following ? "Following" : "Follow community"}
      </Button>
      {following ? (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Bell className="h-3.5 w-3.5" aria-hidden />
          Optional challenge alerts for {communityName}
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Free to follow — you won&apos;t auto-join every challenge.
        </p>
      )}
    </div>
  );
}
