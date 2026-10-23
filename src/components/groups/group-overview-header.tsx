import { UserAvatar } from "@/components/ui/user-avatar";
import { computeTodayAccountabilityStats } from "@/lib/groups/check-in-board-stats";
import { groupFocusLabel } from "@/lib/groups/focus-labels";
import type { AccountabilityGroup } from "@/types";

export function GroupOverviewHeader({ group }: { group: AccountabilityGroup }) {
  const stats = computeTodayAccountabilityStats(group.checkInBoard);
  const preview = group.checkInBoard.slice(0, 5);

  return (
    <div className="surface-soft space-y-3 p-4">
      <div>
        <p className="text-title-lg leading-snug">{group.name}</p>
        <p className="text-caption">{groupFocusLabel(group.focusType, group.focusCustomLabel)}</p>
        {group.sharedGoal ? (
          <p className="mt-1 text-sm text-muted-foreground">{group.sharedGoal}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <ul className="flex -space-x-2">
          {preview.map((m) => (
            <li key={m.userId}>
              <UserAvatar
                displayName={m.displayName}
                size="sm"
                className="ring-2 ring-surface"
              />
            </li>
          ))}
        </ul>
        <p className="text-right text-sm text-muted-foreground">
          {stats.scheduledCount > 0 ? (
            <>
              <span className="font-semibold tabular-nums text-foreground">
                {stats.checkedInCount}/{stats.scheduledCount}
              </span>{" "}
              checked in today
            </>
          ) : (
            "Rest day for check-ins"
          )}
        </p>
      </div>
    </div>
  );
}
