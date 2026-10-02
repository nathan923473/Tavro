import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { demoUser } from "@/lib/mock-data";
import {
  Bell,
  Download,
  LogOut,
  Shield,
  Smartphone,
  UserRound,
} from "lucide-react";

export const metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <div className="animate-fade-up">
      <PageHeader title="Profile" subtitle="Account & preferences" />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <UserRound className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-semibold">{demoUser.firstName}</p>
              <p className="text-sm text-muted-foreground">
                Demo profile · auth coming next
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {demoUser.habits.map((habit) => (
              <Badge key={habit} tone="muted">
                {habit}
              </Badge>
            ))}
          </div>
        </Card>

        <InstallPrompt />

        <Card>
          <h2 className="font-semibold">Coming with Supabase</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Email sign-up, login, and password reset
            </li>
            <li className="flex items-center gap-2">
              <Bell className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Opt-in push notifications (structure ready)
            </li>
            <li className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Onboarding: goals, habits, optional group
            </li>
          </ul>
        </Card>

        <div className="space-y-2">
          <Button variant="outline" fullWidth className="justify-start">
            <Download className="h-4 w-4" aria-hidden />
            Export my data
          </Button>
          <Button variant="outline" fullWidth className="justify-start">
            <Shield className="h-4 w-4" aria-hidden />
            Privacy & blocking
          </Button>
          <Button variant="ghost" fullWidth className="justify-start text-red-600">
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
