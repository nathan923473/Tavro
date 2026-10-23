"use client";

import {
  saveGroupWeeklyCommitmentAction,
  sendGroupEncouragementAction,
} from "@/app/(app)/groups/actions";
import { GroupCheckInReactions } from "@/components/groups/group-check-in-reactions";
import { GroupHabitLinksPanel } from "@/components/groups/group-habit-links-panel";
import { GroupSharedCommitmentsDashboard } from "@/components/groups/group-shared-commitments-dashboard";
import { GroupWeeklyCommitmentsBoard } from "@/components/groups/group-weekly-commitments-board";
import { GroupWeeklyReflectionCard } from "@/components/groups/group-weekly-reflection-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  habitAlreadyWeeklyCommitment,
  weeklyCommitmentTargetFromHabit,
} from "@/lib/groups/commitment-from-habit";
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
  const [commitTitle, setCommitTitle] = useState("");
  /** String so users can clear the field and type a new number (avoids "13" when replacing "1"). */
  const [commitTargetInput, setCommitTargetInput] = useState("3");
  function parsedCommitTarget(): number {
    const n = Number.parseInt(commitTargetInput.trim(), 10);
    if (!Number.isFinite(n)) return 3;
    return Math.min(99, Math.max(1, n));
  }
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

  const ownWeeklyCommitments = useMemo(
    () => group.weeklyCommitments.filter((c) => c.isOwn),
    [group.weeklyCommitments],
  );

  const habitsForCommitmentPicker = useMemo(
    () =>
      viewerHabits.filter(
        (h) => !h.paused && !habitAlreadyWeeklyCommitment(h, ownWeeklyCommitments),
      ),
    [viewerHabits, ownWeeklyCommitments],
  );

  return (
    <div className="space-y-4">
      <GroupSharedCommitmentsDashboard group={group} pending={pending} run={run} />
      <GroupWeeklyReflectionCard group={group} pending={pending} run={run} />
      <Card className="space-y-3">
        <h3 className="font-semibold">This week</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Your consistency</p>
            <p className="text-lg font-bold text-foreground">
              {weekProgress.target ? `${weekProgress.pct}%` : "—"}
            </p>
            {weekProgress.target ? (
              <p className="text-xs text-muted-foreground">
                {weekProgress.done}/{weekProgress.target} commitment steps
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Add a weekly commitment below</p>
            )}
          </div>
          <div className="rounded-xl bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Group consistency</p>
            <p className="text-lg font-bold text-foreground">
              {groupWeekProgress.target ? `${groupWeekProgress.pct}%` : "—"}
            </p>
            {groupWeekProgress.target ? (
              <p className="text-xs text-muted-foreground">
                {groupWeekProgress.done}/{groupWeekProgress.target} across members
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Goals appear as members set them</p>
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

      <GroupWeeklyCommitmentsBoard group={group} pending={pending} run={run} />

      <Card className="space-y-3 border-primary/15 bg-primary/[0.03]">
        <div>
          <h3 className="font-semibold">Add a weekly group commitment</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Group commitment</span> — everyone in
            this private group sees it on the weekly board below. You log progress with &quot;Log one
            time&quot; (Mon–Sun). This is separate from linking daily Progress habits.
          </p>
        </div>
        {habitsForCommitmentPicker.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-border bg-surface/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              From Progress (weekly target only)
            </p>
            <p className="text-xs text-muted-foreground">
              Copies the habit name and a weekly count — does not link daily check-offs. Use{" "}
              <span className="font-medium text-foreground">Link Progress habits</span> above for
              that.
            </p>
            <ul className="flex flex-wrap gap-2">
              {habitsForCommitmentPicker.map((habit) => {
                const target = weeklyCommitmentTargetFromHabit(habit);
                return (
                  <li key={habit.id}>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-10 max-w-full text-left text-xs font-medium"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          saveGroupWeeklyCommitmentAction({
                            groupId: group.id,
                            title: habit.title,
                            targetCount: target,
                          }),
                        )
                      }
                    >
                      + {habit.title}
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({target}× this week)
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : viewerHabits.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Your Progress habits are already on this week&apos;s group board — or add a custom
            target below.
          </p>
        ) : null}
        <div className="rounded-xl border border-dashed border-border bg-surface/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your custom group target
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            A one-off weekly goal for this group only — not tied to Progress (e.g. &quot;Morning
            walk&quot; 3×).
          </p>
        <label className="block text-sm font-medium">
          What do you want to do?
          <input
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm font-normal"
            placeholder="e.g. Morning walk"
            value={commitTitle}
            onChange={(e) => setCommitTitle(e.target.value)}
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Short name only — put the number of times in the next field.
          </span>
        </label>
        <fieldset className="block text-sm font-medium">
          <legend className="mb-1">How many times this week?</legend>
          <div className="flex flex-wrap gap-2">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`min-h-10 rounded-xl border px-4 text-sm font-semibold ${
                  parsedCommitTarget() === n && commitTargetInput === String(n)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-foreground"
                }`}
                onClick={() => setCommitTargetInput(String(n))}
              >
                {n}×
              </button>
            ))}
          </div>
          <label className="mt-2 block text-xs font-normal text-muted-foreground">
            Or type a number (1–99)
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm font-normal text-foreground"
              value={commitTargetInput}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
                setCommitTargetInput(digits);
              }}
              onBlur={() => {
                if (!commitTargetInput.trim()) setCommitTargetInput("3");
              }}
            />
          </label>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Example: 4 means you&apos;ll tap &quot;Log one time&quot; up to four times (Mon–Sun).
          </span>
        </fieldset>
        {commitTitle.trim() ? (
          <p className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Preview:{" "}
            <span className="font-medium text-foreground">{commitTitle.trim()}</span> — 0 of{" "}
            {parsedCommitTarget()}{" "}
            {parsedCommitTarget() === 1 ? "time" : "times"} this week
          </p>
        ) : null}
        <Button
          type="button"
          fullWidth
          disabled={pending || !commitTitle.trim() || !commitTargetInput.trim()}
          onClick={() =>
            run(async () => {
              await saveGroupWeeklyCommitmentAction({
                groupId: group.id,
                title: commitTitle,
                targetCount: parsedCommitTarget(),
              });
              setCommitTitle("");
              setCommitTargetInput("3");
            })
          }
        >
          Add group commitment
        </Button>
        </div>
      </Card>

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
