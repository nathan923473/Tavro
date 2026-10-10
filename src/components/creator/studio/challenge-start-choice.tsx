import { Card } from "@/components/ui/card";
import { LayoutTemplate, PenLine } from "lucide-react";
import Link from "next/link";

export function ChallengeStartChoice() {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Start with a blank plan, or open a template and change anything before you publish.
      </p>
      <Link href="/studio/challenges/new?template=scratch" className="block">
        <Card className="flex items-start gap-3 transition-colors hover:bg-muted/40">
          <PenLine className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block font-semibold">Start from scratch</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Set the name, dates, and daily tasks yourself.
            </span>
          </span>
        </Card>
      </Link>
      <Link href="/studio/challenges/templates" className="block">
        <Card className="flex items-start gap-3 border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
          <LayoutTemplate className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block font-semibold">Choose a template</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Preview a ready-made plan, then edit every part of it.
            </span>
          </span>
        </Card>
      </Link>
    </div>
  );
}
