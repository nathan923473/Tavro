import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function CreatorStudioProfileCard() {
  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-secondary/20">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
          aria-hidden
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">Creator Studio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your challenges, community and creator business — free for approved
            creators.
          </p>
          <Link
            href="/studio"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground sm:w-auto"
          >
            Open Creator Studio →
          </Link>
        </div>
      </div>
    </Card>
  );
}
