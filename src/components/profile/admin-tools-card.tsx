import { Card } from "@/components/ui/card";
import { BarChart3, FileWarning, MailPlus, UserCheck } from "lucide-react";
import Link from "next/link";

export function AdminToolsCard() {
  return (
    <Card className="border-primary/25 bg-primary/5">
      <h2 className="font-semibold">Admin tools</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Platform owner · not visible to members or creators
      </p>
      <ul className="mt-3 space-y-2">
        <li>
          <Link
            href="/admin/analytics"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
            Founder analytics
          </Link>
        </li>
        <li>
          <Link
            href="/admin/creator-invitations"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
          >
            <MailPlus className="h-4 w-4 shrink-0" aria-hidden />
            Invite a creator
          </Link>
          <Link
            href="/admin/creator-applications"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
          >
            <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
            Creator applications
          </Link>
        </li>
        <li>
          <Link
            href="/admin/content-reports"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
          >
            <FileWarning className="h-4 w-4 shrink-0" aria-hidden />
            Content reports
          </Link>
        </li>
      </ul>
    </Card>
  );
}
