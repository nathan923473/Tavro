"use client";

import { submitGroupDailyCheckInAction } from "@/app/(app)/groups/actions";
import { GroupCheckInReactions } from "@/components/groups/group-check-in-reactions";
import { GroupHubSettingsModal } from "@/components/groups/group-hub-settings";
import { GroupInviteModal } from "@/components/groups/group-invite-modal";
import { GroupInvitePanel } from "@/components/groups/group-invite-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { computeTodayAccountabilityStats } from "@/lib/groups/check-in-board-stats";
import { groupFocusLabel } from "@/lib/groups/focus-labels";
import type { AccountabilityGroup, GroupDailyCheckInStatus } from "@/types";
import { Check, Settings2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

const CHECK_IN_OPTIONS: { value: GroupDailyCheckInStatus; label: string }[] = [
  { value: "completed", label: "Completed my planned activity" },
  { value: "partial", label: "Made some progress" },
  { value: "missed", label: "Didn't complete my planned activity" },
  { value: "rest", label: "Planned rest day" },
];

function memberStatusLabel(m: AccountabilityGroup["checkInBoard"][number]): string {
  if (!m.scheduledToday) return "Rest day";
  if (!m.checkedIn) return "Pending";
  if (m.status === "rest") return "Rest day";
  if (m.status === "missed") return "Logged";
  return "Checked in";
}

export function GroupTabToday({
  group,
  viewerUserId,
  pending,
  run,
  onOpenProgress,
  discoveryOwnerEligible = false,
}: {
  group: AccountabilityGroup;
  viewerUserId?: string | null;
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
  onOpenProgress: () => void;
  discoveryOwnerEligible?: boolean;
}) {
  const soloOwner = group.memberCount <= 1;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [checkInNote, setCheckInNote] = useState("");
  const [checkInStatus, setCheckInStatus] = useState<GroupDailyCheckInStatus>("completed");

  const stats = useMemo(
    () => computeTodayAccountabilityStats(group.checkInBoard),
    [group.checkInBoard],
  );

  const viewerCheckedIn = Boolean(
    group.viewerCheckInStatus &&
      group.checkInBoard.some((m) => m.userId === viewerUserId && m.checkedIn),
  );

  const today = new Date().toISOString().slice(0, 10);
  const recentForToday = group.recentCheckIns.filter((c) => c.checkInDate === today).slice(0, 4);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-snug text-foreground">{group.name}</h2>
            <p className="mt-0.5 text-sm font-medium text-primary">
              {groupFocusLabel(group.focusType, group.focusCustomLabel)}
            </p>
            {group.sharedGoal ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{group.sharedGoal}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full border border-border p-2 text-muted-foreground hover:bg-muted"
            aria-label="Group settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex -space-x-2">
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
          <span className="text-sm text-muted-foreground">
            {group.memberCount}/{group.maxMembers} members
          </span>
          {!soloOwner ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 gap-1 px-3 text-xs"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Invite friends
            </Button>
          ) : null}
        </div>
      </Card>

      {soloOwner ? (
        <GroupInvitePanel
          inviteCode={group.inviteCode}
          invitesEnabled={group.invitesEnabled}
          isOwner={group.isOwner}
          groupId={group.id}
          memberCount={group.memberCount}
          maxMembers={group.maxMembers}
          joinMode={group.joinMode}
          pendingRequests={group.pendingRequests}
          visibility={group.visibility}
          discoveryPaused={group.discoveryPaused}
          checkInFrequency={group.checkInFrequency}
          discoverySummary={group.discoverySummary}
          discoveryOwnerEligible={discoveryOwnerEligible}
        />
      ) : null}

      <Card className="overflow-hidden border-primary/20 p-0">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4">
          <h3 className="text-base font-semibold text-foreground">Today&apos;s accountability</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.scheduledCount > 0
              ? `${stats.checkedInCount} of ${stats.scheduledCount} checked in`
              : "No check-ins scheduled today — rest day for the group"}
          </p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {group.checkInBoard.map((m) => {
              const done =
                m.scheduledToday &&
                m.checkedIn &&
                (m.status === "completed" || m.status === "partial" || m.status === "rest");
              const pendingToday = m.scheduledToday && !m.checkedIn;
              return (
                <li key={m.userId} className="flex w-[4.5rem] flex-col items-center gap-1 text-center">
                  <div className="relative">
                    <UserAvatar
                      displayName={m.displayName}
                      avatarUrl={m.avatarUrl}
                      size="md"
                      className={
                        done
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                          : pendingToday
                            ? "ring-2 ring-border ring-offset-2 ring-offset-background"
                            : "opacity-70"
                      }
                    />
                    {done ? (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-mint-subtle text-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                      </span>
                    ) : m.scheduledToday ? (
                      <span
                        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-muted-foreground/40 bg-background"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <span className="line-clamp-1 text-[10px] font-medium text-foreground">
                    {m.displayName.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{memberStatusLabel(m)}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            {!group.viewerScheduledToday ? (
              <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-center text-sm text-muted-foreground">
                Rest day for you — no check-in needed today.
              </div>
            ) : viewerCheckedIn ? (
              <div className="rounded-xl border border-accent bg-mint-subtle/30 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-foreground">You checked in today</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {group.viewerCheckInStatus?.replace("_", " ")}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 min-h-9 text-xs"
                  onClick={() => setShowCheckInForm((v) => !v)}
                >
                  Update check-in
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                fullWidth
                className="min-h-11 bg-primary text-base hover:bg-primary-dark"
                disabled={pending}
                onClick={() => setShowCheckInForm(true)}
              >
                Check in today
              </Button>
            )}
          </div>

          {showCheckInForm && group.viewerScheduledToday ? (
            <div className="mt-3 space-y-2 rounded-xl border border-border bg-background p-3">
              <fieldset className="space-y-2">
                {CHECK_IN_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="checkin-today"
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
                className="bg-primary hover:bg-primary-dark"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await submitGroupDailyCheckInAction({
                      groupId: group.id,
                      status: checkInStatus,
                      note: checkInNote,
                    });
                    setShowCheckInForm(false);
                  })
                }
              >
                Save check-in
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Recent activity</h3>
          <button
            type="button"
            className="text-xs font-medium text-primary"
            onClick={onOpenProgress}
          >
            Full progress
          </button>
        </div>
        <ul className="mt-3 space-y-3 text-sm">
          {recentForToday.length === 0 ? (
            <li className="text-muted-foreground">Check-ins from today will show here.</li>
          ) : (
            recentForToday.map((item) => (
              <li key={item.userId} className="flex gap-2">
                <UserAvatar displayName={item.displayName} avatarUrl={item.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="font-medium">{item.displayName}</span>{" "}
                    <span className="text-muted-foreground">· {item.timeAgo}</span>
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {item.status.replace("_", " ")}
                  </p>
                  {item.note ? <p className="mt-0.5 line-clamp-2">{item.note}</p> : null}
                  {viewerUserId && item.userId !== viewerUserId ? (
                    <GroupCheckInReactions
                      groupId={group.id}
                      targetUserId={item.userId}
                      checkInDate={item.checkInDate}
                      reactions={item.reactions}
                      viewerReactionKeys={item.viewerReactionKeys}
                      disabled={pending}
                      compact
                    />
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <GroupInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteCode={group.inviteCode}
        invitesEnabled={group.invitesEnabled}
        isOwner={group.isOwner}
        groupId={group.id}
        memberCount={group.memberCount}
        maxMembers={group.maxMembers}
        joinMode={group.joinMode}
        pendingRequests={group.pendingRequests}
        visibility={group.visibility}
        discoveryPaused={group.discoveryPaused}
        checkInFrequency={group.checkInFrequency}
        discoverySummary={group.discoverySummary}
        discoveryOwnerEligible={discoveryOwnerEligible}
      />

      <GroupHubSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        group={group}
        pending={pending}
        run={run}
      />
    </div>
  );
}
