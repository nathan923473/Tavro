import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchOwnerCommunity } from "@/lib/data/communities";
import Link from "next/link";
import { Bell, Link2, Megaphone, UserCircle } from "lucide-react";

export const metadata = { title: "Creator profile & settings" };

export default async function StudioSettingsPage() {
  const { user } = await requireApprovedCreator();
  const community = await fetchOwnerCommunity(user.id);

  const links = [
    {
      href: community ? `/creator/${community.slug}/edit` : "/studio/community/setup",
      label: "Public creator profile",
      description: "Bio, photos, social links and community page",
      icon: UserCircle,
    },
    {
      href: "/profile",
      label: "Member profile & photo",
      description: "Display name and avatar used across Tavro",
      icon: UserCircle,
    },
    {
      href: "/studio/shop",
      label: "Shop & coaching links",
      description: "External links on your creator page",
      icon: Link2,
    },
    {
      href: community ? "/studio/announcements" : "/studio/community/setup",
      label: "Community announcements",
      description: "Updates between challenges",
      icon: Megaphone,
    },
    {
      href: "/profile#notification-settings",
      label: "Notification preferences",
      description: "Challenge and community alerts",
      icon: Bell,
    },
  ] as const;

  return (
    <StudioLayout
      title="Creator profile & settings"
      subtitle="Free tools · approval stays with Tavro moderators"
    >
      <Card className="border-dashed text-sm text-muted-foreground">
        You cannot change creator approval here. Contact support if your application
        status needs review.
      </Card>

      <ul className="space-y-2">
        {links.map(({ href, label, description, icon: Icon }) => (
          <li key={label}>
            <Link href={href}>
              <Card padding="sm" className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {community ? (
        <Link
          href={`/creator/${community.slug}`}
          className="block text-center text-sm font-medium text-primary"
        >
          Preview public profile →
        </Link>
      ) : null}
    </StudioLayout>
  );
}
