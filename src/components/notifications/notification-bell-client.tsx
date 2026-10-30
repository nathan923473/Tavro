"use client";

import { unreadNotificationCountAction } from "@/app/(app)/notifications/actions";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

export function NotificationBellClient({ userId }: { userId: string }) {
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    unreadNotificationCountAction(userId).then((n) => {
      if (!cancelled) setUnread(n);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface"
      aria-label={
        unread && unread > 0 ? `${unread} unread notifications` : "Notifications"
      }
    >
      <Bell className="h-5 w-5" aria-hidden />
      {unread != null && unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
