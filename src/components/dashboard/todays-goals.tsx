import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PersonalGoal } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";

type TodaysGoalsProps = {
  goals: PersonalGoal[];
};

const categoryLabel: Record<PersonalGoal["category"], string> = {
  movement: "Movement",
  nutrition: "Nutrition",
  mindfulness: "Mindfulness",
  routine: "Routine",
};

export function TodaysGoals({ goals }: TodaysGoalsProps) {
  const completed = goals.filter((g) => g.completedToday).length;

  return (
    <section className="space-y-3" aria-labelledby="todays-goals-heading">
      <div className="flex items-end justify-between px-1">
        <div>
          <h2 id="todays-goals-heading" className="text-base font-semibold">
            Today&apos;s goals
          </h2>
          <p className="text-sm text-muted-foreground">
            {completed} of {goals.length} complete · skip days without guilt
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {goals.map((goal) => (
          <li key={goal.id}>
            <Card
              className={
                goal.completedToday
                  ? "border-emerald-200/80 bg-emerald-50/50"
                  : undefined
              }
            >
              <div className="flex items-start gap-3">
                {goal.completedToday ? (
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                    aria-label="Completed"
                  />
                ) : (
                  <Circle
                    className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50"
                    aria-label="Not completed"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{goal.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone="muted">{categoryLabel[goal.category]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {goal.streakDays}-day streak
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
