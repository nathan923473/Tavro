"use client";

import {
  saveGroupWeeklyCommitmentAction,
  sendGroupEncouragementAction,
} from "@/app/(app)/groups/actions";
import { GroupCheckInReactions } from "@/components/groups/group-check-in-reactions";
import { GroupWeeklyCommitmentsBoard } from "@/components/groups/group-weekly-commitments-board";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { AccountabilityGroup, GroupActivity } from "@/types";
import { useMemo, useState } from "react";

export function GroupTabProgress({
  group,
  feed,
  viewerUserId,
  pending,
  run,
}: {
  group: AccountabilityGroup;
  feed: GroupActivity[];
  viewerUserId?: string | null;
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const [commitTitle, setCommitTitle] = useState("");
  const [commitTarget, setCommitTarget] = useState("3");
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
  const parsedTarget = Number.parseInt(commitTarget, 10);
  const previewCount =
    commitTarget.trim() === "" || !Number.isFinite(parsedTarget)
      ? 3
      : Math.min(99, Math.max(1, parsedTarget));
  const commitmentPreview = commitTitle.trim()
    ? `${commitTitle.trim()} · ${previewCount} ${previewCount === 1 ? "time" : "times"} this week`
    : null;

  return (
    <div className="space-y-4">
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
              <p className="text-xs text-muted-foreground">Add a weekly commitment below</p>
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

      <Card className="space-y-3">
        <div>
          <h3 className="font-semibold">Weekly commitments</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone’s weekly targets. Progress is about showing up, not comparing totals.
          </p>
        </div>
        <GroupWeeklyCommitmentsBoard
          commitments={group.weeklyCommitments}
          pending={pending}
          run={run}
        />
        <label className="block text-sm" htmlFor={`commitment-title-${group.id}`}>
          What do you want to do?
          <input
            id={`commitment-title-${group.id}`}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="Walk"
            value={commitTitle}
            onChange={(e) => setCommitTitle(e.target.value)}
          />
        </label>
        <div className="text-sm">
          <label className="block" htmlFor={`commitment-count-${group.id}`}>
            How many times this week?
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {[2, 3, 4, 5].map((count) => {
              const selected = commitTarget === String(count);
              return (
                <button
                  key={count}
                  type="button"
                  aria-pressed={selected}
                  className={`min-h-11 rounded-full px-3 text-sm font-semibold ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-foreground"
                  }`}
                  onClick={() => setCommitTarget(String(count))}
                >
                  {count}×
                </button>
              );
            })}
            <input
              id={`commitment-count-${group.id}`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="min-h-11 w-16 rounded-xl border border-border px-3 py-2 text-sm"
              value={commitTarget}
              onFocus={(event) => event.currentTarget.select()}
              onMouseUp={(event) => event.preventDefault()}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "");
                if (!digits) {
                  setCommitTarget("");
                  return;
                }
                setCommitTarget(String(Math.min(99, Number.parseInt(digits, 10))));
              }}
              onBlur={(event) => {
                const digits = event.currentTarget.value.replace(/\D/g, "");
                if (!digits) {
                  setCommitTarget("3");
                  return;
                }
                const parsed = Number.parseInt(digits, 10);
                setCommitTarget(String(Math.min(99, Math.max(1, parsed))));
              }}
            />
          </div>
        </div>
        {commitmentPreview ? (
          <p className="rounded-xl bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Preview</span>
            <span className="mt-0.5 block">{commitmentPreview}</span>
          </p>
        ) : null}
        <Button
          type="button"
          fullWidth
          disabled={pending || !commitTitle.trim()}
          onClick={() =>
            run(async () => {
              await saveGroupWeeklyCommitmentAction({
                groupId: group.id,
                title: commitTitle,
                targetCount: previewCount,
              });
              setCommitTitle("");
            })
          }
        >
          Add commitment
        </Button>
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
