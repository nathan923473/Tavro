"use client";

import { markNotificationReadAction } from "@/app/(app)/notifications/actions";
import { Card } from "@/components/ui/card";
import type { AppNotification } from "@/lib/data/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NotificationList({ items }: { items: AppNotification[] }) {
  const router = useRouter();

  if (!items.length) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li key={n.id}>
          <Card
            className={n.readAt ? "opacity-80" : "border-primary/30"}
            padding="sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.readAt ? (
                <button
                  type="button"
                  className="text-xs font-medium text-primary"
                  onClick={() => {
                    void markNotificationReadAction(n.id).then(() => router.refresh());
                  }}
                >
                  Mark read
                </button>
              ) : null}
            </div>
            {n.linkPath ? (
              <Link href={n.linkPath} className="mt-2 inline-block text-sm font-semibold text-primary">
                Open →
              </Link>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}
