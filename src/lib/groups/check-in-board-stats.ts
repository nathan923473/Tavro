import type { GroupCheckInBoardMember } from "@/types";

export function computeTodayAccountabilityStats(board: GroupCheckInBoardMember[]) {
  const scheduled = board.filter((m) => m.scheduledToday);
  const completed = scheduled.filter(
    (m) => m.checkedIn && (m.status === "completed" || m.status === "partial" || m.status === "rest"),
  );
  const donePositive = scheduled.filter(
    (m) => m.checkedIn && (m.status === "completed" || m.status === "partial"),
  );

  return {
    scheduledCount: scheduled.length,
    checkedInCount: donePositive.length,
    completedOrPartialCount: completed.length,
  };
}
