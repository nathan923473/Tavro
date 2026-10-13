"use client";

import {
  saveGroupPersonalGoalAction,
  submitGroupDailyCheckInAction,
} from "@/app/(app)/groups/actions";
import { GroupCheckInReactions } from "@/components/groups/group-check-in-reactions";
import { GroupHubSettingsModal } from "@/components/groups/group-hub-settings";
import { GroupInviteModal } from "@/components/groups/group-invite-modal";
import { GroupInvitePanel } from "@/components/groups/group-invite-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { computeTodayAccountabilityStats } from "@/lib/groups/check-in-board-stats";
import { groupFocusLabel } from "@/lib/groups/focus-labels";
import { PERSONAL_SCHEDULE_OPTIONS } from "@/lib/groups/goal-schedule";
import type {
  AccountabilityGroup,
  GroupDailyCheckInStatus,
  GroupPersonalScheduleType,
} from "@/types";
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
  const [showGoalForm, setShowGoalForm] = useState(false);

  const goal = group.viewerPersonalGoal;
  const [goalTitle, setGoalTitle] = useState(goal?.title ?? "");
  const [scheduleType, setScheduleType] = useState<GroupPersonalScheduleType>(
    goal?.scheduleType ?? "daily",
  );
  const [timesPerWeek, setTimesPerWeek] = useState(goal?.timesPerWeek ?? 3);
  const [scheduleInterval, setScheduleInterval] = useState(goal?.scheduleInterval ?? 2);
  const [weekdays, setWeekdays] = useState<number[]>(goal?.scheduleWeekdays ?? [1, 3, 5]);

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

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-snug text-[#1B2440]">{group.name}</h2>
            <p className="mt-0.5 text-sm font-medium text-[#3156E8]">
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

      <Card className="overflow-hidden border-[#3156E8]/20 p-0">
        <div className="bg-gradient-to-br from-[#3156E8]/10 via-background to-[#B8F4DA]/20 p-4">
          <h3 className="text-base font-semibold text-[#1B2440]">Today&apos;s accountability</h3>
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
                          ? "ring-2 ring-[#B8F4DA] ring-offset-2 ring-offset-background"
                          : pendingToday
                            ? "ring-2 ring-border ring-offset-2 ring-offset-background"
                            : "opacity-70"
                      }
                    />
                    {done ? (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#B8F4DA] text-[#1B2440]">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                      </span>
                    ) : m.scheduledToday ? (
                      <span
                        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-muted-foreground/40 bg-background"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <span className="line-clamp-1 text-[10px] font-medium text-[#1B2440]">
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
              <div className="rounded-xl border border-[#B8F4DA] bg-[#B8F4DA]/30 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-[#1B2440]">You checked in today</p>
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
                className="min-h-11 bg-[#3156E8] text-base hover:bg-[#2442C4]"
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
                className="bg-[#3156E8] hover:bg-[#2442C4]"
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

      <Card className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-[#1B2440]">My goal</h3>
            <p className="mt-1 text-sm font-medium">{goal?.title}</p>
            <p className="text-xs text-muted-foreground">{goal?.scheduleLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {group.viewerScheduledToday
                ? "You're scheduled to check in today."
                : "Not scheduled today — rest day."}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="min-h-9 shrink-0 text-xs"
            onClick={() => {
              setGoalTitle(goal?.title ?? "");
              setScheduleType(goal?.scheduleType ?? "daily");
              setShowGoalForm((v) => !v);
            }}
          >
            Edit goal
          </Button>
        </div>
        {showGoalForm ? (
          <div className="space-y-2 border-t border-border pt-3">
            <label className="block text-sm">
              Personal goal
              <input
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Schedule
              <select
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as GroupPersonalScheduleType)}
              >
                {PERSONAL_SCHEDULE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {scheduleType === "every_n_days" ? (
              <label className="block text-sm">
                Every N days
                <input
                  type="number"
                  min={2}
                  max={14}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  value={scheduleInterval}
                  onChange={(e) => setScheduleInterval(Number(e.target.value))}
                />
              </label>
            ) : null}
            {scheduleType === "times_per_week" ? (
              <label className="block text-sm">
                Times per week
                <input
                  type="number"
                  min={1}
                  max={7}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  value={timesPerWeek}
                  onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                />
              </label>
            ) : null}
            {scheduleType === "weekdays" ? (
              <div className="flex flex-wrap gap-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    className={
                      weekdays.includes(i)
                        ? "min-h-9 min-w-9 rounded-full bg-[#3156E8] text-xs font-semibold text-white"
                        : "min-h-9 min-w-9 rounded-full border border-border text-xs"
                    }
                    onClick={() => toggleWeekday(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            <Button
              type="button"
              fullWidth
              disabled={pending || goalTitle.trim().length < 2}
              onClick={() =>
                run(async () => {
                  await saveGroupPersonalGoalAction({
                    groupId: group.id,
                    title: goalTitle,
                    scheduleType,
                    scheduleInterval,
                    scheduleWeekdays: weekdays,
                    timesPerWeek,
                  });
                  setShowGoalForm(false);
                })
              }
            >
              Save personal goal
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Recent activity</h3>
          <button
            type="button"
            className="text-xs font-medium text-[#3156E8]"
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
