"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Bell, UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";

type FollowCommunityButtonProps = {
  communityName: string;
  initiallyFollowing?: boolean;
  className?: string;
};

export function FollowCommunityButton({
  communityName,
  initiallyFollowing = false,
  className,
}: FollowCommunityButtonProps) {
  const [following, setFollowing] = useState(initiallyFollowing);

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        fullWidth
        variant={following ? "secondary" : "primary"}
        onClick={() => setFollowing((f) => !f)}
        style={
          !following
            ? undefined
            : undefined
        }
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
          Optional challenge alerts for {communityName} (demo)
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Free to follow — you won&apos;t auto-join every challenge.
        </p>
      )}
    </div>
  );
}
