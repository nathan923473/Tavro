"use client";

import { Button } from "@/components/ui/button";
import {
  ACCOUNTABILITY_GROUP_MOTIVATION_BODY,
  ACCOUNTABILITY_GROUP_MOTIVATION_HEADLINE,
} from "@/lib/copy/accountability-groups";
import { Users } from "lucide-react";

export function GroupsMotivationBanner({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-secondary/40 p-4">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Users className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">
            {ACCOUNTABILITY_GROUP_MOTIVATION_HEADLINE}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {ACCOUNTABILITY_GROUP_MOTIVATION_BODY}
          </p>
          {onCreateClick ? (
            <Button type="button" className="mt-3" onClick={onCreateClick}>
              Create your group
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
