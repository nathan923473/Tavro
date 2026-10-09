"use client";

import { toggleGroupCheckInReactionAction } from "@/app/(app)/groups/actions";
import {
  GROUP_CHECK_IN_REACTION_LABELS,
  type GroupCheckInReactionCounts,
  type GroupCheckInReactionKey,
} from "@/types";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const REACTION_KEYS: GroupCheckInReactionKey[] = ["clap", "fire", "muscle", "heart"];

export function GroupCheckInReactions({
  groupId,
  targetUserId,
  checkInDate,
  reactions,
  viewerReactionKeys,
  disabled,
  compact,
}: {
  groupId: string;
  targetUserId: string;
  checkInDate: string;
  reactions: GroupCheckInReactionCounts;
  viewerReactionKeys: GroupCheckInReactionKey[];
  disabled?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(key: GroupCheckInReactionKey) {
    if (disabled || pending) return;
    startTransition(async () => {
      try {
        await toggleGroupCheckInReactionAction({
          groupId,
          targetUserId,
          checkInDate,
          reactionKey: key,
        });
        router.refresh();
      } catch {
        /* surface via parent refresh errors if needed */
      }
    });
  }

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-2"}`}>
      {REACTION_KEYS.map((key) => {
        const { emoji, label } = GROUP_CHECK_IN_REACTION_LABELS[key];
        const count = reactions[key];
        const active = viewerReactionKeys.includes(key);
        return (
          <button
            key={key}
            type="button"
            title={label}
            disabled={disabled || pending}
            onClick={() => toggle(key)}
            className={
              active
                ? "inline-flex min-h-8 items-center gap-1 rounded-full border border-[#B8F4DA] bg-[#B8F4DA]/50 px-2 text-xs font-medium text-[#1B2440]"
                : "inline-flex min-h-8 items-center gap-1 rounded-full border border-border bg-background px-2 text-xs text-muted-foreground hover:border-primary/30"
            }
          >
            <span aria-hidden>{emoji}</span>
            {count > 0 ? <span>{count}</span> : null}
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
