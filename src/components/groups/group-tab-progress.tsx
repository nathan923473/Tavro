"use client";

import { sendGroupEncouragementAction } from "@/app/(app)/groups/actions";
import { GroupCheckInReactions } from "@/components/groups/group-check-in-reactions";
import { GroupHabitLinksPanel } from "@/components/groups/group-habit-links-panel";
import { GroupSharedCommitmentsDashboard } from "@/components/groups/group-shared-commitments-dashboard";
import { GroupWeeklyReflectionCard } from "@/components/groups/group-weekly-reflection-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { AccountabilityGroup, GroupActivity, PersonalGoal } from "@/types";
import { useMemo, useState } from "react";

export function GroupTabProgress({
  group,
  feed,
  viewerUserId,
  viewerHabits = [],
  pending,
  run,
}: {
  group: AccountabilityGroup;
  feed: GroupActivity[];
  viewerUserId?: string | null;
  viewerHabits?: PersonalGoal[];
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const [encourageTarget, setEncourageTarget] = useState("");
  const [encourageMessage, setEncourageMessage] = useState(
    "Hey! Thinking of you — hope today feels manageable. You've got this.",
  );

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

  const scheduledThisWeek = group.checkInBoard.filter((m) => m.scheduledToday).length;

  return (
    <div className="space-y-4">
      <GroupSharedCommitmentsDashboard group={group} pending={pending} run={run} />
      <GroupWeeklyReflectionCard group={group} pending={pending} run={run} />
      <Card className="space-y-3">
        <h3 className="font-semibold">This week</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Your consistency</p>
            <p className="text-lg font-bold text-[#1B2440]">
              {weekProgress.target ? `${weekProgress.pct}%` : "—"}
            </p>
            {weekProgress.target ? (
              <p className="text-xs text-muted-foreground">
                {weekProgress.done}/{weekProgress.target} commitment steps
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No targets logged this week</p>
            )}
          </div>
          <div className="rounded-xl bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Group consistency</p>
            <p className="text-lg font-bold text-[#1B2440]">
              {groupWeekProgress.target ? `${groupWeekProgress.pct}%` : "—"}
            </p>
            {groupWeekProgress.target ? (
              <p className="text-xs text-muted-foreground">
                {groupWeekProgress.done}/{groupWeekProgress.target} across members
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No targets logged this week</p>
            )}
          </div>
        </div>
        {group.weeklyRecap ? (
          <div className="border-t border-border pt-3 text-sm">
            <p className="font-medium">Last week highlights</p>
            <p className="text-xs text-muted-foreground">Week starting {group.weeklyRecap.weekStart}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {group.weeklyRecap.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm">{group.weeklyRecap.reflectionPrompt}</p>
          </div>
        ) : null}
      </Card>

      <GroupHabitLinksPanel
        groupId={group.id}
        groupName={group.name}
        habits={viewerHabits}
        pending={pending}
        run={run}
      />

      <Card>
        <h3 className="font-semibold">Check-in history</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {scheduledThisWeek > 0
            ? "Recent check-ins from your group — react to encourage someone."
            : "Check-ins will appear here as members log them."}
        </p>
        <ul className="mt-3 max-h-96 space-y-3 overflow-y-auto text-sm">
          {group.recentCheckIns.length === 0 ? (
            <li className="text-muted-foreground">No check-ins yet this week.</li>
          ) : (
            group.recentCheckIns.map((item) => (
              <li key={`${item.userId}-${item.checkInDate}`} className="rounded-xl border border-border/80 px-3 py-2">
                <div className="flex items-start gap-2">
                  <UserAvatar
                    displayName={item.displayName}
                    avatarUrl={item.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {item.displayName}{" "}
                      <span className="font-normal text-muted-foreground">· {item.timeAgo}</span>
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {item.status.replace("_", " ")} · {item.checkInDate}
                    </p>
                    {item.note ? <p className="mt-1">{item.note}</p> : null}
                    {viewerUserId && item.userId !== viewerUserId ? (
                      <GroupCheckInReactions
                        groupId={group.id}
                        targetUserId={item.userId}
                        checkInDate={item.checkInDate}
                        reactions={item.reactions}
                        viewerReactionKeys={item.viewerReactionKeys}
                        disabled={pending}
                      />
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card>
        <h3 className="font-semibold">Group activity</h3>
        <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto text-sm">
          {feed.length === 0 ? (
            <li className="text-muted-foreground">Messages and wins will show here.</li>
          ) : (
            feed.map((item) => (
              <li key={item.id} className="rounded-xl border border-border/80 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.kind}</p>
                <p className="mt-1">
                  <span className="font-semibold">{item.author}</span> {item.message}
                </p>
                <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
              </li>
            ))
          )}
        </ul>
      </Card>

      {group.checkInBoard.some((m) => !m.checkedIn && m.scheduledToday && m.userId !== viewerUserId) ? (
        <Card className="space-y-2">
          <p className="text-sm font-medium">Send encouragement</p>
          <select
            className="w-full rounded-lg border border-border px-2 py-2 text-sm"
            value={encourageTarget}
            onChange={(e) => setEncourageTarget(e.target.value)}
          >
            <option value="">Choose a member…</option>
            {group.checkInBoard
              .filter((m) => m.scheduledToday && !m.checkedIn && m.userId !== viewerUserId)
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
        </Card>
      ) : null}
    </div>
  );
}
