import { NotificationList } from "@/components/notifications/notification-list";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchNotificationsForUser } from "@/lib/data/notifications";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { user } = await getCurrentUserProfile();
  if (!user) redirect("/login?next=/notifications");

  const items = await fetchNotificationsForUser(user.id);

  return (
    <div className="animate-fade-up pb-6">
      <PageHeader
        title="Notifications"
        subtitle="Challenge updates · no private health details"
        action={
          <Link href="/profile#notification-settings" className="text-sm font-medium text-primary">
            Settings
          </Link>
        }
      />
      <div className="px-4 py-4">
        <NotificationList items={items} />
      </div>
    </div>
  );
}
