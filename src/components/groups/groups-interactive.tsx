"use client";

import {
  createAccountabilityGroupAction,
  deleteAccountabilityGroupAction,
  leaveGroupAction,
  postGroupMessageAction,
  removeGroupMemberAction,
  requestJoinGroupByInviteCodeAction,
  transferGroupOwnershipAction,
  updateGroupSettingsAction,
  type GroupJoinMode,
} from "@/app/(app)/groups/actions";
import { GroupInvitePanel } from "@/components/groups/group-invite-panel";
import { GroupPendingJoinCard } from "@/components/groups/group-pending-join-card";
import { GroupPendingRequestsAlert } from "@/components/groups/group-pending-requests-alert";
import { GroupsMotivationBanner } from "@/components/groups/groups-motivation-banner";
import type { PendingGroupJoin } from "@/lib/data/groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ACCOUNTABILITY_GROUP_MAX_MEMBERS,
  ACCOUNTABILITY_GROUP_PLURAL,
  ACCOUNTABILITY_GROUP_SINGULAR,
  ACCOUNTABILITY_GROUP_SIZE_LABEL,
} from "@/lib/copy/accountability-groups";
import type { AccountabilityGroup, GroupActivity } from "@/types";
import { ReportContentMenu } from "@/components/moderation/report-content-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MessageCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function GroupsInteractive({
  group,
  feed,
  loggedIn,
  viewerUserId = null,
  pendingJoin = null,
}: {
  group: AccountabilityGroup | null;
  feed: GroupActivity[];
  loggedIn: boolean;
  viewerUserId?: string | null;
  pendingJoin?: PendingGroupJoin | null;
}) {
  const router = useRouter();
  const createFormRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupGoal, setNewGroupGoal] = useState("");
  const [joinMode, setJoinMode] = useState<GroupJoinMode>("approval");
  const [showOwnerSettings, setShowOwnerSettings] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  if (!loggedIn) {
    return (
      <div className="space-y-4">
        <GroupsMotivationBanner />
        <Card>
          <p className="text-sm text-muted-foreground">
            Log in to create or join a {ACCOUNTABILITY_GROUP_SINGULAR} (
            {ACCOUNTABILITY_GROUP_SIZE_LABEL.toLowerCase()}).
          </p>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <GroupsMotivationBanner
          onCreateClick={() =>
            createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />

        {pendingJoin ? <GroupPendingJoinCard pendingJoin={pendingJoin} /> : null}

        <div ref={createFormRef}>
        <Card className={pendingJoin ? "opacity-90" : undefined}>
          <h2 className="font-semibold">Create a {ACCOUNTABILITY_GROUP_SINGULAR}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingJoin
              ? `Finish or cancel your pending join request before creating a new ${ACCOUNTABILITY_GROUP_SINGULAR}.`
              : `${ACCOUNTABILITY_GROUP_SIZE_LABEL} · private invite link & code`}
          </p>
          <label className="mt-3 block text-sm">
            <span className="font-medium">Group name</span>
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Morning Movers"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="font-medium">Main fitness or healthy habit goal</span>
            <input
              value={newGroupGoal}
              onChange={(e) => setNewGroupGoal(e.target.value)}
              placeholder="Stay consistent with daily exercise"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="font-medium">Who can join?</span>
            <select
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={joinMode}
              onChange={(e) => setJoinMode(e.target.value as GroupJoinMode)}
            >
              <option value="approval">Owner approval required</option>
              <option value="auto">Anyone with a valid invite joins automatically</option>
            </select>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            Maximum {ACCOUNTABILITY_GROUP_MAX_MEMBERS} members
          </p>
          <Button
            className="mt-3"
            fullWidth
            disabled={pending || Boolean(pendingJoin)}
            onClick={() =>
              startTransition(async () => {
                try {
                  await createAccountabilityGroupAction({
                    name: newGroupName.trim() || "My group",
                    goal: newGroupGoal.trim(),
                    joinMode,
                  });
                  setStatus("Your group is ready — invite a few friends who share your goals.");
                  router.refresh();
                } catch (e) {
                  setStatus(e instanceof Error ? e.message : "Failed");
                }
              })
            }
          >
            Create {ACCOUNTABILITY_GROUP_SINGULAR}
          </Button>
        </Card>
        </div>

        <Card>
          <h2 className="font-semibold">Join with a code</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingJoin
              ? "Cancel your pending request above to join a different group, or wait for approval."
              : "Enter a code from a friend"}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ABC123"
              className="flex-1 rounded-xl border border-border px-3 py-2 text-sm uppercase"
            />
            <Button
              variant="secondary"
              disabled={pending || !joinCode.trim() || Boolean(pendingJoin)}
              onClick={() =>
                startTransition(async () => {
                  try {
                    const result = await requestJoinGroupByInviteCodeAction(joinCode.trim());
                    setStatus(result.message);
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
        </Card>

        {status ? (
          <p
            className={
              /failed|leave|invalid|full|migration/i.test(status)
                ? "text-sm text-red-600"
                : "text-sm text-muted-foreground"
            }
            role="status"
          >
            {status}
          </p>
        ) : null}
      </div>
    );
  }

  const checkedIn = group.members.filter((m) => m.checkedInToday).length;
  const soloOwner = group.memberCount <= 1;

  return (
    <div className="space-y-4">
      {group.isOwner && group.pendingRequests.length > 0 ? (
        <GroupPendingRequestsAlert pendingRequests={group.pendingRequests} />
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary/15 via-background to-secondary/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">P.A. group</p>
              <h2 className="mt-1 text-xl font-bold leading-snug">{group.name}</h2>
              {group.goal ? (
                <p className="mt-2 text-sm text-muted-foreground">{group.goal}</p>
              ) : null}
              <p className="mt-2 text-sm font-medium">
                {group.memberCount}/{group.maxMembers} members
                {group.isOwner ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">· You&apos;re the owner</span>
                ) : null}
              </p>
            </div>
            <Badge tone="success">{checkedIn} checked in today</Badge>
          </div>

          <div className="mt-4 flex -space-x-2">
            {group.members.slice(0, 6).map((member) => (
              <UserAvatar
                key={member.id}
                displayName={member.displayName}
                avatarUrl={member.avatarUrl}
                size="sm"
                className="ring-2 ring-background"
              />
            ))}
          </div>
        </div>

        {soloOwner ? (
          <div className="border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Your group is ready! Invite a few friends who share your goals.
          </div>
        ) : null}
      </Card>

      <GroupInvitePanel
        inviteCode={group.inviteCode}
        invitesEnabled={group.invitesEnabled}
        isOwner={group.isOwner}
        groupId={group.id}
        memberCount={group.memberCount}
        maxMembers={group.maxMembers}
        joinMode={group.joinMode}
        pendingRequests={group.pendingRequests}
      />

      <Card>
        <h3 className="font-semibold capitalize">{ACCOUNTABILITY_GROUP_SINGULAR} chat</h3>
        {soloOwner ? (
          <p className="mt-2 text-sm text-muted-foreground">
            When friends join, introduce yourselves and cheer each other on — messages stay private
            to members.
          </p>
        ) : null}
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
          {feed.length === 0 ? (
            <li className="text-muted-foreground">No messages yet — say hi!</li>
          ) : (
            feed.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start gap-2">
                <span>
                  <span className="font-semibold">{item.author}</span> {item.message}
                </span>
                <ReportContentMenu
                  contentType="group_message"
                  contentId={item.id}
                  reportedUserId={item.authorId}
                  canReport={Boolean(viewerUserId && viewerUserId !== item.authorId)}
                  compact
                />
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
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {group.members.map((member) => (
            <li key={member.id}>
              <Card padding="sm" className="flex items-center gap-3">
                <UserAvatar
                  displayName={member.displayName}
                  avatarUrl={member.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {member.displayName}
                    {member.id === group.ownerId ? (
                      <span className="ml-1 text-xs text-muted-foreground">· Owner</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.checkedInToday ? "Checked in today" : "Not yet today"}
                  </p>
                </div>
                {group.isOwner && member.id !== group.ownerId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-9 px-2 text-xs"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await removeGroupMemberAction(group.id, member.id);
                        router.refresh();
                      })
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {group.isOwner ? (
        <Card className="space-y-3">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left font-semibold"
            onClick={() => {
              setShowOwnerSettings((v) => !v);
              setEditName(group.name);
              setEditGoal(group.goal);
            }}
          >
            Owner settings
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
          </button>
          {showOwnerSettings ? (
            <>
              <label className="block text-sm">
                Group name
                <input
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Group goal
                <input
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                />
              </label>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await updateGroupSettingsAction({
                      groupId: group.id,
                      name: editName,
                      goal: editGoal,
                    });
                    router.refresh();
                  })
                }
              >
                Save name & goal
              </Button>
              {group.members.length > 1 ? (
                <label className="block text-sm">
                  Transfer ownership to
                  <select
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      const nextOwner = e.target.value;
                      if (!nextOwner) return;
                      startTransition(async () => {
                        await transferGroupOwnershipAction(group.id, nextOwner);
                        router.refresh();
                      });
                    }}
                  >
                    <option value="">Select member…</option>
                    {group.members
                      .filter((m) => m.id !== group.ownerId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName}
                        </option>
                      ))}
                  </select>
                </label>
              ) : null}
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
                <p className="text-sm font-medium text-red-900">Delete group</p>
                <p className="mt-1 text-xs text-red-800/90">
                  Permanently removes this group, its chat history for all members, and memberships.
                  Personal progress outside the group is not deleted.
                </p>
                <input
                  className="mt-2 w-full rounded-lg border border-red-200 px-2 py-1.5 text-sm"
                  placeholder={`Type "${group.name}" to confirm`}
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  className="mt-2 border-red-300 text-red-700"
                  disabled={pending || deleteConfirm.trim() !== group.name}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteAccountabilityGroupAction(group.id, deleteConfirm);
                      router.refresh();
                    })
                  }
                >
                  Delete group permanently
                </Button>
              </div>
            </>
          ) : null}
        </Card>
      ) : null}

      <Button
        variant="outline"
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await leaveGroupAction();
              router.refresh();
            } catch (e) {
              setStatus(e instanceof Error ? e.message : "Failed");
            }
          })
        }
      >
        Leave {ACCOUNTABILITY_GROUP_SINGULAR}
      </Button>

      {status ? (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
