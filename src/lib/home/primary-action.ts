import { habitsScheduledToday } from "@/lib/habits/schedule";
import { computeTodayAccountabilityStats } from "@/lib/groups/check-in-board-stats";
import type { AccountabilityGroup, PersonalGoal } from "@/types";
import type { ChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";

export type HomePrimaryAction = {
  label: string;
  href: string;
  allComplete?: boolean;
};

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function resolveHomePrimaryAction(input: {
  goals: PersonalGoal[];
  group: AccountabilityGroup | null;
  viewerUserId: string | null;
  activeChallengeHub: ChallengeParticipantHub | null;
  loggedIn: boolean;
}): HomePrimaryAction {
  if (!input.loggedIn) {
    return { label: "Log in to continue", href: "/login" };
  }

  const scheduled = habitsScheduledToday(input.goals);
  const habitsDone = scheduled.filter((g) => g.completedToday).length;
  const habitsTotal = scheduled.length;

  if (habitsTotal > 0 && habitsDone < habitsTotal) {
    return { label: "Continue today's progress", href: "/#habits-heading" };
  }

  if (input.group && input.viewerUserId) {
    const viewerRow = input.group.checkInBoard.find((m) => m.userId === input.viewerUserId);
    const viewerCheckedIn = Boolean(viewerRow?.checkedIn);

    if (input.group.viewerScheduledToday && !viewerCheckedIn) {
      return { label: "Check in with your group", href: "/groups" };
    }

    const stats = computeTodayAccountabilityStats(input.group.checkInBoard);
    if (stats.scheduledCount > stats.checkedInCount) {
      return { label: "Encourage your group", href: "/groups" };
    }
  }

  if (input.activeChallengeHub?.phase === "active") {
    const hasOpenToday =
      !input.activeChallengeHub.isRestDay &&
      input.activeChallengeHub.todayActivities.some((a) => !a.completed);
    if (hasOpenToday) {
      return {
        label: "Continue today's challenge",
        href: `/challenges/${input.activeChallengeHub.challengeId}?tab=today`,
      };
    }
  }

  if (habitsTotal === 0 && !input.group && !input.activeChallengeHub) {
    return { label: "Create your first goal", href: "/progress#habits-manage-heading" };
  }

  const habitsComplete = habitsTotal === 0 || habitsDone === habitsTotal;
  const groupOk =
    !input.group ||
    computeTodayAccountabilityStats(input.group.checkInBoard).scheduledCount === 0 ||
    computeTodayAccountabilityStats(input.group.checkInBoard).checkedInCount >=
      computeTodayAccountabilityStats(input.group.checkInBoard).scheduledCount;

  if (habitsComplete && groupOk) {
    return {
      label: "You're all caught up today",
      href: "/groups",
      allComplete: true,
    };
  }

  return { label: "View your progress", href: "/progress" };
}
