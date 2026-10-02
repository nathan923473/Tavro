import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { accountabilityGroup, groupFeed } from "@/lib/mock-data";
import { Heart, MessageCircle, Users } from "lucide-react";

export const metadata = {
  title: "Groups",
};

export default function GroupsPage() {
  const checkedIn = accountabilityGroup.members.filter(
    (m) => m.checkedInToday,
  ).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Groups"
        subtitle="Small circles, private encouragement"
      />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-secondary p-2.5 text-secondary-foreground">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{accountabilityGroup.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {accountabilityGroup.memberCount} members · optional participation ·
                no public weigh-ins
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="success">
                  {checkedIn} checked in today
                </Badge>
                <Badge tone="muted">
                  {accountabilityGroup.checkInStreak}-day group streak
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button fullWidth>Open group chat</Button>
            <Button variant="outline" fullWidth>
              Leave group
            </Button>
          </div>
        </Card>

        <section aria-labelledby="members-heading">
          <h2 id="members-heading" className="mb-2 px-1 text-base font-semibold">
            Members
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {accountabilityGroup.members.map((member) => (
              <li key={member.id}>
                <Card padding="sm">
                  <p className="font-medium">{member.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.checkedInToday ? "Checked in" : "Not yet today"}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="feed-heading">
          <h2 id="feed-heading" className="mb-2 px-1 text-base font-semibold">
            Recent encouragement
          </h2>
          <ul className="space-y-2">
            {groupFeed.map((item) => (
              <li key={item.id}>
                <Card>
                  <p className="text-sm">
                    <span className="font-semibold">{item.author}</span>{" "}
                    {item.message}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{item.timeAgo}</span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-primary"
                    >
                      <Heart className="h-4 w-4" aria-hidden />
                      {item.reactions}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      Reply
                    </button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
