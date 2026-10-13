export const MILESTONE_DEFINITIONS: Record<
  string,
  { label: string; description: string }
> = {
  first_week: {
    label: "First week completed",
    description: "Logged habits across your first full week.",
  },
  walks_10: {
    label: "10 walks completed",
    description: "Walking habit completed 10 times.",
  },
  workouts_25: {
    label: "25 workouts completed",
    description: "Movement habits completed 25 times.",
  },
  weeks_consistent_4: {
    label: "4 consistent weeks",
    description: "Weekly consistency at 70%+ for four weeks.",
  },
  first_challenge: {
    label: "First creator challenge completed",
    description: "Finished a creator-led challenge.",
  },
  consistency_30d: {
    label: "30-day consistency",
    description: "Thirty days of showing up for your habits.",
  },
  returned_after_break: {
    label: "Back on track",
    description: "Returned to your challenge after a break — progress still counts.",
  },
  weekly_goal_met: {
    label: "Strong week",
    description: "Hit at least 70% of your planned habits this week.",
  },
};
