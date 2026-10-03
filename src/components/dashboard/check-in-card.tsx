"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import { CalendarCheck2 } from "lucide-react";

export function CheckInCard() {
  const { hasCheckedInToday, checkInToday } = useDemoStore();
  const done = hasCheckedInToday();

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-accent/15 p-2.5 text-accent">
          <CalendarCheck2 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">Daily check-in</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Log how today felt — energy, mood, or a quick win. No weigh-in required.
          </p>
        </div>
      </div>
      <Button
        className="shrink-0"
        variant={done ? "secondary" : "primary"}
        disabled={done}
        onClick={() => checkInToday()}
      >
        {done ? "Checked in today ✓" : "Check in today"}
      </Button>
    </Card>
  );
}
