"use client";

import {
  createAccountabilityGroup,
  joinGroupByInviteCode,
  leaveGroupAction,
  postGroupMessageAction,
} from "@/app/(app)/member/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import type { AccountabilityGroup, GroupActivity } from "@/types";
import { groupInvitePath } from "@/lib/site-url";
import { Heart, MessageCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function GroupsInteractive({
  group,
  feed,
  loggedIn,
}: {
  group: AccountabilityGroup | null;
  feed: GroupActivity[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [joinCode, setJoinCode] = useState("");

  if (!loggedIn) {
    return (
      <Card>
        <h2 className="font-semibold">Accountability groups</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in to create or join a private group (4–8 people).
        </p>
      </Card>
    );
  }

  if (!group) {
    return (
      <Card>
        <h2 className="font-semibold">You&apos;re not in a group</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Start a small circle or join with an invite code from a friend.
        </p>
        <div className="mt-4 space-y-2">
          <Button
            fullWidth
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await createAccountabilityGroup("My accountability group");
                  setStatus("Group created — invite friends with your link.");
                  router.refresh();
                } catch (e) {
                  setStatus(e instanceof Error ? e.message : "Failed");
                }
              })
            }
          >
            Start a group
          </Button>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Invite code"
              className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
            />
            <Button
              variant="secondary"
              disabled={pending || !joinCode.trim()}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await joinGroupByInviteCode(joinCode.trim());
                    setStatus("Joined group.");
                    router.refresh();
                  } catch (e) {
                    setStatus(e instanceof Error ? e.message : "Failed");
                  }
                })
              }
            >
              Join
            </Button>
          </div>
        </div>
        {status ? (
          <p className="mt-2 text-sm text-muted-foreground">{status}</p>
        ) : null}
      </Card>
    );
  }

  const checkedIn = group.members.filter((m) => m.checkedInToday).length;

  return (
    <>
      <Card>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-secondary p-2.5 text-secondary-foreground">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{group.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {group.memberCount}/{group.maxMembers} members · invite friends ·
              no public weigh-ins
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="success">{checkedIn} checked in today</Badge>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <CopyLinkButton
            url={groupInvitePath(group.inviteCode)}
            label="Copy group invite link"
            fullWidth
          />
          <Button
            variant="outline"
            fullWidth
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await leaveGroupAction();
                router.refresh();
              })
            }
          >
            Leave group
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold">Group chat</h3>
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
          {feed.length === 0 ? (
            <li className="text-muted-foreground">No messages yet.</li>
          ) : (
            feed.map((item) => (
              <li key={item.id}>
                <span className="font-semibold">{item.author}</span>{" "}
                {item.message}
              </li>
            ))
          )}
        </ul>
        <textarea
          rows={2}
          value={chatDraft}
          onChange={(e) => setChatDraft(e.target.value)}
          className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="Encourage your group…"
        />
        <Button
          className="mt-2"
          fullWidth
          disabled={pending || !chatDraft.trim()}
          onClick={() =>
            startTransition(async () => {
              try {
                await postGroupMessageAction(chatDraft);
                setChatDraft("");
                router.refresh();
              } catch (e) {
                setStatus(e instanceof Error ? e.message : "Failed");
              }
            })
          }
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Send message
        </Button>
      </Card>

      <section aria-labelledby="members-heading">
        <h2 id="members-heading" className="mb-2 px-1 text-base font-semibold">
          Members
        </h2>
        <ul className="grid grid-cols-2 gap-2">
          {group.members.map((member) => (
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
          {feed.map((item) => (
            <li key={item.id}>
              <Card>
                <p className="text-sm">
                  <span className="font-semibold">{item.author}</span>{" "}
                  {item.message}
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{item.timeAgo}</span>
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Heart className="h-4 w-4" aria-hidden />
                    {item.reactions}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {status ? (
        <p className="text-sm text-muted-foreground">{status}</p>
      ) : null}
    </>
  );
}
