import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ACCOUNTABILITY_GROUP_SINGULAR } from "@/lib/copy/accountability-groups";
import type { AccountabilityGroup, GroupActivity } from "@/types";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";

type GroupActivityPreviewProps = {
  group: AccountabilityGroup;
  feed: GroupActivity[];
};

export function GroupActivityPreview({
  group,
  feed,
}: GroupActivityPreviewProps) {
  const checkedIn = group.members.filter((m) => m.checkedInToday).length;

  return (
    <section className="space-y-3" aria-labelledby="group-activity-heading">
      <div className="flex items-center justify-between px-1">
        <h2 id="group-activity-heading" className="text-base font-semibold capitalize">
          {ACCOUNTABILITY_GROUP_SINGULAR} activity
        </h2>
        <Link href="/groups" className="text-sm font-medium text-primary">
          Open {ACCOUNTABILITY_GROUP_SINGULAR}
        </Link>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{group.name}</p>
          <Badge tone="success">
            {checkedIn}/{group.memberCount} checked in
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{group.recentMessage}</p>
      </Card>
      <ul className="space-y-2">
        {feed.slice(0, 2).map((item) => (
          <li key={item.id}>
            <Card padding="sm">
              <p className="text-sm">
                <span className="font-semibold">{item.author}</span>{" "}
                <span className="text-muted-foreground">{item.message}</span>
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{item.timeAgo}</span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" aria-hidden />
                  {item.reactions}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                  Encourage
                </span>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
