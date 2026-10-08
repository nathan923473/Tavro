"use client";

import {
  deleteGroupWeeklyCommitmentAction,
  deleteAccountabilityGroupAction,
  leaveGroupAction,
  postGroupMessageAction,
  removeGroupMemberAction,
  saveGroupWeeklyCommitmentAction,
  sendGroupEncouragementAction,
  submitGroupDailyCheckInAction,
  toggleGroupMessageReactionAction,
  transferGroupOwnershipAction,
  updateGroupCommitmentProgressAction,
  updateGroupSettingsAction,
  setGroupParticipationPauseAction,
} from "@/app/(app)/groups/actions";
import { GroupInvitePanel } from "@/components/groups/group-invite-panel";
import { GroupPendingRequestsAlert } from "@/components/groups/group-pending-requests-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ACCOUNTABILITY_GROUP_SINGULAR,
} from "@/lib/copy/accountability-groups";
import { groupFocusLabel } from "@/lib/groups/focus-labels";
import type {
  AccountabilityGroup,
  GroupActivity,
  GroupDailyCheckInStatus,
} from "@/types";
import { ReportContentMenu } from "@/components/moderation/report-content-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MessageCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type HubTab = "overview" | "commitments" | "checkin" | "activity" | "chat" | "week";

const TAB_LABELS: { id: HubTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "commitments", label: "Goals" },
  { id: "checkin", label: "Check-in" },
  { id: "activity", label: "Activity" },
  { id: "chat", label: "Chat" },
  { id: "week", label: "Week" },
];

const CHECK_IN_OPTIONS: { value: GroupDailyCheckInStatus; label: string }[] = [
  { value: "completed", label: "Completed my planned activity" },
  { value: "partial", label: "Made some progress" },
  { value: "missed", label: "Didn't complete my planned activity" },
  { value: "rest", label: "Planned rest day" },
];

export function GroupHubView({
  group,
  feed,
  viewerUserId = null,
}: {
  group: AccountabilityGroup;
  feed: GroupActivity[];
  viewerUserId?: string | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<HubTab>("overview");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [commitTitle, setCommitTitle] = useState("");
  const [commitTarget, setCommitTarget] = useState(3);
  const [checkInNote, setCheckInNote] = useState("");
  const [checkInStatus, setCheckInStatus] = useState<GroupDailyCheckInStatus>("completed");
  const [encourageTarget, setEncourageTarget] = useState("");
  const [encourageMessage, setEncourageMessage] = useState(
    "Hey! Thinking of you — hope today feels manageable. You've got this.",
  );
  const [showOwnerSettings, setShowOwnerSettings] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description);
  const [editSharedGoal, setEditSharedGoal] = useState(group.sharedGoal);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const checkedInCount = group.checkInBoard.filter((m) => m.checkedIn).length;
  const notCheckedIn = group.checkInBoard.filter((m) => !m.checkedIn);
  const soloOwner = group.memberCount <= 1;

  const weekProgress = useMemo(() => {
    const own = group.weeklyCommitments.filter((c) => c.isOwn);
    const target = own.reduce((s, c) => s + c.targetCount, 0);
    const done = own.reduce((s, c) => s + Math.min(c.progressCount, c.targetCount), 0);
    return { target, done, pct: target ? Math.round((done / target) * 100) : 0 };
  }, [group.weeklyCommitments]);

  const groupWeekProgress = useMemo(() => {
    const target = group.weeklyCommitments.reduce((s, c) => s + c.targetCount, 0);
    const done = group.weeklyCommitments.reduce(
      (s, c) => s + Math.min(c.progressCount, c.targetCount),
      0,
    );
    return { target, done, pct: target ? Math.round((done / target) * 100) : 0 };
  }, [group.weeklyCommitments]);

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action();
        setStatus(null);
        router.refresh();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {group.isOwner && group.pendingRequests.length > 0 ? (
        <GroupPendingRequestsAlert pendingRequests={group.pendingRequests} />
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TAB_LABELS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={
              tab === t.id
                ? "shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                : "shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
            }
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-br from-primary/15 via-background to-secondary/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {group.isActive ? "Active group" : "Waiting for members"}
                  </p>
                  <h2 className="mt-1 text-xl font-bold leading-snug">{group.name}</h2>
                  <p className="mt-1 text-xs font-medium text-primary/90">
                    {groupFocusLabel(group.focusType, group.focusCustomLabel)}
                  </p>
                  {group.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
                  ) : null}
                  {group.sharedGoal ? (
                    <p className="mt-2 text-sm">
                      <span className="font-medium">Shared goal:</span> {group.sharedGoal}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm font-medium">
                    {group.memberCount}/{group.maxMembers} members
                    {!group.isActive ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        · Active at 2+ members
                      </span>
                    ) : null}
                  </p>
                </div>
                <Badge tone="success">{checkedInCount} checked in today</Badge>
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
              {groupWeekProgress.target > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Group weekly progress: {groupWeekProgress.done}/{groupWeekProgress.target} (
                  {groupWeekProgress.pct}%)
                </p>
              ) : null}
            </div>
            {soloOwner ? (
              <div className="border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Invite friends to activate your group — accountability works best together.
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
        </>
      ) : null}

      {tab === "commitments" ? (
        <Card className="space-y-3">
          <div>
            <h3 className="font-semibold">My weekly commitments</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set measurable goals for this week. Your group can see progress — not weight or
              calories.
            </p>
            {weekProgress.target > 0 ? (
              <p className="mt-2 text-sm font-medium">
                Your progress: {weekProgress.done}/{weekProgress.target} ({weekProgress.pct}%)
              </p>
            ) : null}
          </div>

          <ul className="space-y-2">
            {group.weeklyCommitments.filter((c) => c.isOwn).length === 0 ? (
              <li className="text-sm text-muted-foreground">No commitments yet this week.</li>
            ) : (
              group.weeklyCommitments
                .filter((c) => c.isOwn)
                .map((c) => {
                  const done = c.progressCount >= c.targetCount;
                  return (
                    <li
                      key={c.id}
                      className={`rounded-xl border px-3 py-2 ${done ? "border-green-200 bg-green-50/50" : "border-border"}`}
                    >
                      <p className={`text-sm font-medium ${done ? "line-through opacity-70" : ""}`}>
                        {c.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.min(c.progressCount, c.targetCount)}/{c.targetCount} completed
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-8 px-2 text-xs"
                          disabled={pending || c.progressCount >= c.targetCount}
                          onClick={() =>
                            run(() =>
                              updateGroupCommitmentProgressAction(c.id, c.progressCount + 1),
                            )
                          }
                        >
                          +1 progress
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-8 px-2 text-xs"
                          disabled={pending}
                          onClick={() => run(() => deleteGroupWeeklyCommitmentAction(c.id))}
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  );
                })
            )}
          </ul>

          <label className="block text-sm">
            New commitment
            <input
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              placeholder="Walk 4 times this week"
              value={commitTitle}
              onChange={(e) => setCommitTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Target count
            <input
              type="number"
              min={1}
              max={99}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={commitTarget}
              onChange={(e) => setCommitTarget(Number(e.target.value))}
            />
          </label>
          <Button
            type="button"
            fullWidth
            disabled={pending || !commitTitle.trim()}
            onClick={() =>
              run(async () => {
                await saveGroupWeeklyCommitmentAction({
                  groupId: group.id,
                  title: commitTitle,
                  targetCount: commitTarget,
                });
                setCommitTitle("");
              })
            }
          >
            Add commitment
          </Button>

          {group.weeklyCommitments.some((c) => !c.isOwn) ? (
            <div className="border-t border-border pt-3">
              <h4 className="text-sm font-semibold">Group members</h4>
              <ul className="mt-2 space-y-2 text-sm">
                {group.weeklyCommitments
                  .filter((c) => !c.isOwn)
                  .map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">{c.displayName}:</span> {c.title} (
                      {Math.min(c.progressCount, c.targetCount)}/{c.targetCount})
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}

      {tab === "checkin" ? (
        <Card className="space-y-3">
          <div>
            <h3 className="font-semibold">Daily check-in</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A few seconds to stay accountable — rest days are welcome too.
            </p>
          </div>
          <fieldset className="space-y-2">
            {CHECK_IN_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="checkin"
                  checked={checkInStatus === opt.value}
                  onChange={() => setCheckInStatus(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </fieldset>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="Optional note (how did today go?)"
            value={checkInNote}
            onChange={(e) => setCheckInNote(e.target.value)}
          />
          <Button
            type="button"
            fullWidth
            disabled={pending}
            onClick={() =>
              run(() =>
                submitGroupDailyCheckInAction({
                  groupId: group.id,
                  status: checkInStatus,
                  note: checkInNote,
                }),
              )
            }
          >
            Save today&apos;s check-in
          </Button>

          <div>
            <h4 className="text-sm font-semibold">Today in your group</h4>
            <ul className="mt-2 space-y-2">
              {group.checkInBoard.map((m) => (
                <li key={m.userId} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      displayName={m.displayName}
                      avatarUrl={m.avatarUrl}
                      size="sm"
                    />
                    <span>{m.displayName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {m.checkedIn
                      ? m.status === "rest"
                        ? "Rest day"
                        : "Checked in"
                      : "Not yet"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {notCheckedIn.length > 0 && notCheckedIn.some((m) => m.userId !== viewerUserId) ? (
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
              <p className="text-sm font-medium">Send encouragement</p>
              <select
                className="w-full rounded-lg border border-border px-2 py-2 text-sm"
                value={encourageTarget}
                onChange={(e) => setEncourageTarget(e.target.value)}
              >
                <option value="">Choose a member…</option>
                {notCheckedIn
                  .filter((m) => m.userId !== viewerUserId)
                  .map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.displayName}
                    </option>
                  ))}
              </select>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                value={encourageMessage}
                onChange={(e) => setEncourageMessage(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={pending || !encourageTarget}
                onClick={() =>
                  run(async () => {
                    await sendGroupEncouragementAction({
                      groupId: group.id,
                      toUserId: encourageTarget,
                      message: encourageMessage,
                    });
                    setEncourageTarget("");
                  })
                }
              >
                Send encouragement
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {tab === "activity" ? (
        <Card>
          <h3 className="font-semibold">Group activity</h3>
          <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto text-sm">
            {feed.length === 0 ? (
              <li className="text-muted-foreground">Activity will show check-ins, goals, and wins here.</li>
            ) : (
              feed.map((item) => (
                <li key={item.id} className="rounded-xl border border-border/80 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.kind}</p>
                  <p className="mt-1">
                    <span className="font-semibold">{item.author}</span> {item.message}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
                    {item.kind === "message" && item.messageId ? (
                      <button
                        type="button"
                        className="text-xs font-medium text-primary"
                        disabled={pending}
                        onClick={() =>
                          run(() => toggleGroupMessageReactionAction(item.messageId!))
                        }
                      >
                        👍 {item.reactions > 0 ? item.reactions : "React"}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      ) : null}

      {tab === "chat" ? (
        <Card>
          <h3 className="font-semibold capitalize">{ACCOUNTABILITY_GROUP_SINGULAR} chat</h3>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
            {feed.filter((f) => f.kind === "message").length === 0 ? (
              <li className="text-muted-foreground">No messages yet — say hi!</li>
            ) : (
              feed
                .filter((f) => f.kind === "message")
                .map((item) => (
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
              run(async () => {
                await postGroupMessageAction(chatDraft);
                setChatDraft("");
              })
            }
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Send message
          </Button>
        </Card>
      ) : null}

      {tab === "week" ? (
        <Card className="space-y-3">
          <h3 className="font-semibold">Weekly recap</h3>
          {group.weeklyRecap ? (
            <>
              <p className="text-sm text-muted-foreground">
                Week starting {group.weeklyRecap.weekStart}
              </p>
              <p className="text-sm">
                Commitments completed: {group.weeklyRecap.commitmentCompletionPct}%
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {group.weeklyRecap.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <p className="text-sm font-medium">{group.weeklyRecap.reflectionPrompt}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set commitments and check in this week — your recap will build from real progress.
            </p>
          )}
          <Button type="button" variant="secondary" fullWidth onClick={() => setTab("commitments")}>
            Set next week&apos;s commitments
          </Button>
        </Card>
      ) : null}

      {tab === "overview" ? (
        <>
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
                          run(() => removeGroupMemberAction(group.id, member.id))
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
                onClick={() => setShowOwnerSettings((v) => !v)}
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
                    Description
                    <textarea
                      className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                      rows={2}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    Shared group goal (optional)
                    <input
                      className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                      value={editSharedGoal}
                      onChange={(e) => setEditSharedGoal(e.target.value)}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        updateGroupSettingsAction({
                          groupId: group.id,
                          name: editName,
                          description: editDescription,
                          sharedGoal: editSharedGoal,
                        }),
                      )
                    }
                  >
                    Save group details
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
                          run(() => transferGroupOwnershipAction(group.id, nextOwner));
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
                        run(() => deleteAccountabilityGroupAction(group.id, deleteConfirm))
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
            onClick={() => run(() => leaveGroupAction(group.id))}
          >
            Leave {ACCOUNTABILITY_GROUP_SINGULAR}
          </Button>

          <Button
            variant="ghost"
            fullWidth
            disabled={pending}
            onClick={() =>
              run(() =>
                setGroupParticipationPauseAction(
                  group.id,
                  group.viewerPausedUntil ? null : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                ),
              )
            }
          >
            {group.viewerPausedUntil ? "Resume participation" : "Pause participation for 7 days"}
          </Button>
        </>
      ) : null}

      {status ? (
        <p
          className={
            /transfer|failed|migration|could not|only the/i.test(status)
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
