import type { ChallengeCategory } from "@/types/creator-studio";

export type DailyActivityKind =
  | "walking"
  | "workout"
  | "running"
  | "strength"
  | "habit"
  | "hydration"
  | "sleep"
  | "mindfulness"
  | "custom";

export type ParsedDailyActivity = {
  key: string;
  kind: DailyActivityKind;
  title: string;
  targetNumber: number | null;
  targetUnit: string | null;
};

function inferKind(title: string, category: ChallengeCategory | null): DailyActivityKind {
  const t = title.toLowerCase();
  if (t.includes("step") || t.includes("walk")) return "walking";
  if (t.includes("run") || t.includes("jog")) return "running";
  if (t.includes("strength") || t.includes("squat") || t.includes("workout")) return "workout";
  if (t.includes("water") || t.includes("hydrat")) return "hydration";
  if (t.includes("sleep")) return "sleep";
  if (t.includes("mindful") || t.includes("meditat")) return "mindfulness";
  if (category === "walking") return "walking";
  if (category === "running") return "running";
  if (category === "strength") return "strength";
  if (category === "healthy_habits") return "habit";
  return "custom";
}

function parseStepTarget(title: string): number | null {
  const m = title.replace(/,/g, "").match(/(\d{3,6})\s*steps?/i);
  if (m) return Number(m[1]);
  if (/10,?000|10000/i.test(title)) return 10000;
  if (/8,?000|8000/i.test(title)) return 8000;
  return null;
}

/** Turn one schedule row into one or more check-off activities (no duplicate tables). */
export function parseScheduleItemActivities(
  scheduleItemId: string,
  title: string,
  body: string | null,
  isRest: boolean,
  category: ChallengeCategory | null,
): ParsedDailyActivity[] {
  if (isRest) {
    return [
      {
        key: "primary",
        kind: "custom",
        title: title || "Rest day",
        targetNumber: null,
        targetUnit: null,
      },
    ];
  }

  const primaryKind = inferKind(title, category);
  const stepTarget = primaryKind === "walking" ? parseStepTarget(title) ?? 10000 : null;

  const activities: ParsedDailyActivity[] = [
    {
      key: "primary",
      kind: primaryKind,
      title,
      targetNumber: stepTarget,
      targetUnit: stepTarget ? "steps" : null,
    },
  ];

  if (body) {
    const lines = body
      .split(/\n+/)
      .map((l) => l.replace(/^[\s•\-*\d.)]+/, "").trim())
      .filter(Boolean);
    lines.forEach((line, i) => {
      if (line.toLowerCase() === title.toLowerCase()) return;
      activities.push({
        key: `extra-${i}`,
        kind: inferKind(line, category),
        title: line,
        targetNumber: parseStepTarget(line),
        targetUnit: parseStepTarget(line) ? "steps" : null,
      });
    });
  }

  return activities;
}
