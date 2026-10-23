import { habitsCompletedToday } from "@/lib/progress/consistency";
import type { ChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import type { AccountabilityGroup, PersonalGoal } from "@/types";

export type TodayProgressSegment = {
  id: "habits" | "challenge" | "group";
  label: string;
  done: number;
  total: number;
};

export function computeTodayCompletion(input: {
  goals: PersonalGoal[];
  activeChallengeHub: ChallengeParticipantHub | null;
  group: AccountabilityGroup | null;
  viewerUserId: string | null;
}): {
  percent: number;
  done: number;
  total: number;
  hasPlan: boolean;
  segments: TodayProgressSegment[];
} {
  const segments: TodayProgressSegment[] = [];

  const { done: habitsDone, total: habitsTotal } = habitsCompletedToday(input.goals);
  if (habitsTotal > 0) {
    segments.push({
      id: "habits",
      label: "Habits",
      done: habitsDone,
      total: habitsTotal,
    });
  }

  const hub = input.activeChallengeHub;
  if (hub?.phase === "active" && !hub.isRestDay && hub.todayActivities.length > 0) {
    const done = hub.todayActivities.filter((a) => a.completed).length;
    segments.push({
      id: "challenge",
      label: "Challenge",
      done,
      total: hub.todayActivities.length,
    });
  }

  if (input.group && input.viewerUserId && input.group.viewerScheduledToday) {
    const row = input.group.checkInBoard.find((m) => m.userId === input.viewerUserId);
    segments.push({
      id: "group",
      label: "Group check-in",
      done: row?.checkedIn ? 1 : 0,
      total: 1,
    });
  }

  if (segments.length === 0) {
    return { percent: 0, done: 0, total: 0, hasPlan: false, segments };
  }

  const done = segments.reduce((s, x) => s + x.done, 0);
  const total = segments.reduce((s, x) => s + x.total, 0);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { percent, done, total, hasPlan: true, segments };
}
