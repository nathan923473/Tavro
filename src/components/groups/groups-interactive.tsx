"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import { accountabilityGroup, groupFeed } from "@/lib/mock-data";
import { groupInvitePath } from "@/lib/site-url";
import { Heart, MessageCircle, UserPlus, Users } from "lucide-react";
import { useState } from "react";

export function GroupsInteractive() {
  const {
    state,
    leaveGroup,
    joinGroup,
    openGroupChat,
    reactToFeed,
    replyToFeed,
    getFeedReactionCount,
    isFeedReplied,
  } = useDemoStore();
  const [chatMsg, setChatMsg] = useState<string | null>(null);

  if (!state.inGroup) {
    return (
      <Card>
        <h2 className="font-semibold">You&apos;re not in a group</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Join the demo accountability circle to try group features.
        </p>
        <Button className="mt-4" fullWidth onClick={() => joinGroup()}>
          Join Morning Momentum (demo)
        </Button>
      </Card>
    );
  }

  const checkedIn = accountabilityGroup.members.filter(
    (m) => m.checkedInToday,
  ).length;

  return (
    <>
      <Card>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-secondary p-2.5 text-secondary-foreground">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{accountabilityGroup.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {accountabilityGroup.memberCount}/{accountabilityGroup.maxMembers}{" "}
              members · invite friends · no public weigh-ins
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="success">{checkedIn} checked in today</Badge>
              <Badge tone="muted">
                {accountabilityGroup.checkInStreak}-day group streak
              </Badge>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <CopyLinkButton
            url={groupInvitePath(accountabilityGroup.inviteCode)}
            label="Copy group invite link"
            fullWidth
          />
          <div className="flex gap-2">
            <Button
              fullWidth
              onClick={() => {
                openGroupChat();
                setChatMsg("Group chat opened (demo) — say hi to your circle!");
              }}
            >
              Open group chat
            </Button>
            <Button variant="outline" fullWidth onClick={() => leaveGroup()}>
              Leave group
            </Button>
          </div>
          {chatMsg ? (
            <p className="text-sm text-muted-foreground">{chatMsg}</p>
          ) : null}
        </div>
      </Card>

      <Card className="border-dashed">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p>
            Start another circle anytime. Groups stay small (4–8) so encouragement
            feels personal, not competitive.
          </p>
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
                    onClick={() => reactToFeed(item.id)}
                  >
                    <Heart className="h-4 w-4" aria-hidden />
                    {getFeedReactionCount(item.id, item.reactions)}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => replyToFeed(item.id)}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {isFeedReplied(item.id) ? "Replied ✓" : "Reply"}
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
