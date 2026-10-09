import { Card } from "@/components/ui/card";
import {
  BarChart3,
  Link2,
  PlusCircle,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

export function QuickActionsGrid({
  hasCommunity,
  communitySlug,
}: {
  hasCommunity: boolean;
  communitySlug: string | null;
}) {
  const actions = [
    {
      href: "/studio/challenges/new",
      label: "Create challenge",
      icon: PlusCircle,
      primary: true,
    },
    {
      href: hasCommunity && communitySlug ? `/creator/${communitySlug}/edit` : "/studio/settings",
      label: "Edit creator profile",
      icon: UserCircle,
      disabled: false,
    },
    {
      href: "/studio/analytics",
      label: "View analytics",
      icon: BarChart3,
      disabled: !hasCommunity,
    },
    {
      href: "/studio/community",
      label: "Community",
      icon: Users,
      disabled: !hasCommunity,
    },
    {
      href: "/studio/shop",
      label: "Shop & links",
      icon: Link2,
      disabled: !hasCommunity,
    },
  ];

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="mb-2 text-base font-semibold">
        Quick actions
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ href, label, icon: Icon, primary, disabled }) =>
          disabled ? (
            <Card key={label} padding="sm" className="opacity-50">
              <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              <p className="mt-1 text-xs font-semibold">{label}</p>
            </Card>
          ) : (
            <Link key={label} href={href}>
              <Card
                padding="sm"
                className={
                  primary
                    ? "border-primary/40 bg-primary/5"
                    : undefined
                }
              >
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                <p className="mt-1 text-xs font-semibold">{label}</p>
              </Card>
            </Link>
          ),
        )}
      </div>
      {communitySlug ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Public page: /creator/{communitySlug}
        </p>
      ) : null}
    </section>
  );
}
