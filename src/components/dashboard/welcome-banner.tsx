import { JoinFreeChallengeCta } from "@/components/dashboard/join-free-challenge-cta";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

type WelcomeBannerProps = {
  firstName: string;
  groupName?: string;
};

export function WelcomeBanner({ firstName, groupName }: WelcomeBannerProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 right-8 h-20 w-20 rounded-full bg-white/5" />
      <div className="relative space-y-2">
        <div className="flex items-center gap-2 text-sm text-white/90">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>{greeting}, {firstName}</span>
        </div>
        <p className="text-lg font-semibold leading-snug">
          One steady step today beats a perfect week tomorrow.
        </p>
        {groupName ? (
          <Badge className="bg-white/15 text-white">{groupName}</Badge>
        ) : (
          <Badge className="bg-white/15 text-white">Solo journey · You&apos;ve got this</Badge>
        )}
      </div>
    </Card>
  );
}
