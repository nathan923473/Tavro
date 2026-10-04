"use client";

import { checkInTodayAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function CheckInCard({
  checkedIn,
  loggedIn,
}: {
  checkedIn: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
        <div className="flex-1">
          <h2 className="font-semibold">Daily check-in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One tap to mark that you showed up today — no weigh-in required.
          </p>
          <Button
            className="mt-4"
            fullWidth
            disabled={checkedIn || pending || !loggedIn}
            onClick={() =>
              startTransition(async () => {
                await checkInTodayAction();
                router.refresh();
              })
            }
          >
            {checkedIn
              ? "Checked in today ✓"
              : loggedIn
                ? "Check in for today"
                : "Log in to check in"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
