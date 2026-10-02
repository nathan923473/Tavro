import { Badge } from "@/components/ui/badge";
import type { AchievementCard } from "@/types";
import { Sparkles } from "lucide-react";

type ShareableAchievementCardProps = {
  achievement: AchievementCard;
  userName: string;
};

export function ShareableAchievementCard({
  achievement,
  userName,
}: ShareableAchievementCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-primary-foreground shadow-md"
      aria-label="Shareable achievement preview"
    >
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="relative space-y-3">
        <div className="flex items-center gap-2 text-sm text-white/90">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>SteadyCircle · shared voluntarily</span>
        </div>
        <p className="text-xl font-semibold leading-tight">
          {achievement.headline}
        </p>
        <p className="text-sm text-white/90">{achievement.subline}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge className="bg-white/15 text-white">
            {achievement.consistencyPercent}% consistency
          </Badge>
          <Badge className="bg-white/15 text-white">
            {userName}&apos;s journey
          </Badge>
        </div>
        <p className="text-xs text-white/75">
          No weight or measurements on this card — celebrate habits, not numbers.
        </p>
      </div>
    </div>
  );
}
