"use client";

import {
  saveChallengeDailyCheckInAction,
  saveChallengeStepProgressAction,
  toggleChallengeScheduleCompletionAction,
} from "@/app/(app)/member/actions";
import { ShareChallengeButton } from "@/components/share/share-challenge-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { parseScheduleItemActivities } from "@/lib/challenge-activities";
import type { ChallengeParticipantHub, HubActivityState } from "@/lib/data/challenge-participant-hub";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CalendarRange, MoreHorizontal, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const TABS = [
  { id: "today", label: "Today" },
  { id: "progress", label: "Progress" },
  { id: "members", label: "Members" },
  { id: "plan", label: "Plan" },
  { id: "updates", label: "Updates" },
  { id: "about", label: "About" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const MOODS = [
  { value: "rough", emoji: "😣", label: "Rough" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "great", emoji: "🔥", label: "Great" },
] as const;

export function ChallengeParticipantHub({
  hub,
  viewerUserId = null,
}: {
  hub: ChallengeParticipantHub;
  viewerUserId?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabId) || "today";
  const [pending, startTransition] = useTransition();
  const [shareOpen, setShareOpen] = useState(false);
  const [note, setNote] = useState(hub.todayNote ?? "");
  const [localHub, setLocalHub] = useState(hub);

  const completedToday = localHub.todayActivities.filter((a) => a.completed).length;
  const totalToday = localHub.todayActivities.filter((a) => !localHub.isRestDay).length;

  const progressBarPct = useMemo(() => {
    if (localHub.phase === "completed") return 100;
    return Math.max(
      localHub.progressPercent,
      Math.round((localHub.dayIndex / localHub.totalDays) * 100),
    );
  }, [localHub]);

  function setTab(next: TabId) {
    router.replace(`/challenges/${hub.challengeId}?tab=${next}`, { scroll: false });
  }

  if (localHub.phase === "upcoming") {
    return (
      <div className="space-y-4">
        <HubHeader hub={localHub} shareOpen={shareOpen} setShareOpen={setShareOpen} />
        <Card className="space-y-3 text-center">
          <p className="text-lg font-semibold">You&apos;re in! 🎉</p>
          <p className="text-xl font-semibold">{localHub.title}</p>
          <ChallengeStartCountdown startDate={localHub.startDate} variant="hero" />
          <p className="text-sm text-muted-foreground">
            Your first activities will appear when the countdown ends.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setTab("plan")}>
              View plan
            </Button>
            <Button type="button" variant="outline" onClick={() => setTab("about")}>
              About this challenge
            </Button>
            {localHub.communitySlug ? (
              <Link
                href={`/creator/${localHub.communitySlug}`}
                className="text-sm font-semibold text-primary"
              >
                View {localHub.creatorName}&apos;s community
              </Link>
            ) : null}
          </div>
        </Card>
        <TabBar tab={tab} setTab={setTab} />
        {tab !== "today" ? (
          <TabPanels
            hub={localHub}
            tab={tab}
            viewerUserId={viewerUserId}
            pending={pending}
            startTransition={startTransition}
            onMutate={(next) => {
              setLocalHub(next);
              router.refresh();
            }}
          />
        ) : null}
      </div>
    );
  }

  if (localHub.phase === "completed") {
    return (
      <div className="space-y-4">
        <HubHeader hub={localHub} shareOpen={shareOpen} setShareOpen={setShareOpen} />
        <Card className="space-y-3 text-center">
          <p className="text-3xl" aria-hidden>
            🎉
          </p>
          <p className="text-lg font-semibold">Challenge complete!</p>
          <p className="font-medium">{localHub.title}</p>
          <p className="text-sm text-muted-foreground">
            You completed {localHub.completedDaysCount} / {localHub.totalDays} days ·{" "}
            {localHub.progressPercent}% activity progress
          </p>
          <p className="text-sm">🔥 Best streak: {localHub.bestStreak} days</p>
          <ul className="space-y-1 text-sm">
            {localHub.milestones
              .filter((m) => m.earned)
              .map((m) => (
                <li key={m.key}>{m.label}</li>
              ))}
          </ul>
          <Button type="button" variant="outline" fullWidth onClick={() => setTab("progress")}>
            View full progress
          </Button>
          {localHub.communitySlug ? (
            <Link
              href={`/creator/${localHub.communitySlug}`}
              className="block text-sm font-semibold text-primary"
            >
              View {localHub.creatorName}&apos;s community
            </Link>
          ) : null}
        </Card>
        <TabBar tab={tab} setTab={setTab} />
        {tab !== "today" ? (
          <TabPanels
            hub={localHub}
            tab={tab}
            viewerUserId={viewerUserId}
            pending={pending}
            startTransition={startTransition}
            onMutate={(next) => {
              setLocalHub(next);
              router.refresh();
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <HubHeader hub={localHub} shareOpen={shareOpen} setShareOpen={setShareOpen} />

      <Card padding="sm">
        <p className="text-sm text-muted-foreground">by {localHub.creatorName}</p>
        <p className="text-xs text-muted-foreground">
          Day {localHub.dayIndex} of {localHub.totalDays}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressBarPct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{progressBarPct}% overall</p>
        {localHub.streakDays > 0 ? (
          <Badge tone="success" className="mt-2">
            🔥 {localHub.streakDays}-day consistency streak
          </Badge>
        ) : null}
      </Card>

      <TabBar tab={tab} setTab={setTab} />

      {tab === "today" ? (
        <TodayPanel
          hub={localHub}
          pending={pending}
          completedToday={completedToday}
          totalToday={totalToday}
          note={note}
          setNote={setNote}
          onMutate={(next) => {
            setLocalHub(next);
            router.refresh();
          }}
          startTransition={startTransition}
        />
      ) : (
        <TabPanels
          hub={localHub}
          tab={tab}
          viewerUserId={viewerUserId}
          pending={pending}
          startTransition={startTransition}
          onMutate={(next) => {
            setLocalHub(next);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function HubHeader({
  hub,
  shareOpen,
  setShareOpen,
}: {
  hub: ChallengeParticipantHub;
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold leading-snug">{hub.title}</h1>
      </div>
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="Share challenge"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border"
          onClick={() => setShareOpen(!shareOpen)}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {shareOpen ? (
          <div className="absolute right-0 top-11 z-10 w-48 rounded-xl border border-border bg-surface p-2 shadow-lg">
            <ShareChallengeButton path={hub.canonicalPath} title={hub.title} fullWidth />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1 rounded-xl bg-muted/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TodayPanel({
  hub,
  pending,
  completedToday,
  totalToday,
  note,
  setNote,
  onMutate,
  startTransition,
}: {
  hub: ChallengeParticipantHub;
  pending: boolean;
  completedToday: number;
  totalToday: number;
  note: string;
  setNote: (s: string) => void;
  onMutate: (h: ChallengeParticipantHub) => void;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  return (
    <>
      <Card>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">
          TODAY — {hub.todayLabel}
        </p>
        {hub.isRestDay ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Rest day — recovery counts. Optional gentle movement only.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm font-medium">Today&apos;s activities</p>
            <ul className="mt-3 space-y-3">
              {hub.todayActivities.map((act) => (
                <li key={act.key} className="rounded-xl border border-border p-3">
                  <ActivityRow
                    challengeId={hub.challengeId}
                    scheduleItemId={hub.scheduleItemId!}
                    completedOn={hub.todayKey}
                    act={act}
                    pending={pending}
                    startTransition={startTransition}
                    onActChange={(patch) =>
                      onMutate(
                        patchHubActivity(hub, hub.scheduleItemId!, hub.todayKey, act.key, patch),
                      )
                    }
                  />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {completedToday} of {Math.max(totalToday, 1)} completed
            </p>
          </>
        )}
      </Card>

      {hub.creatorMessage ? (
        <Card className="border-primary/25 bg-primary/5">
          <p className="text-xs font-semibold uppercase text-primary">
            Message from {hub.creatorName.split(" ")[0]}
          </p>
          <p className="mt-1 font-medium">{hub.creatorMessage.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{hub.creatorMessage.body}</p>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <h2 className="font-semibold">How did today go?</h2>
        <p className="text-xs text-muted-foreground">Private — creators don&apos;t see this.</p>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await saveChallengeDailyCheckInAction(hub.challengeId, m.value, note);
                  onMutate({ ...hub, todayMood: m.value });
                })
              }
              className={`rounded-xl border px-2 py-2 text-xs ${
                hub.todayMood === m.value ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="mt-1 block">{m.label}</span>
            </button>
          ))}
        </div>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything you want to remember? (optional)"
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          fullWidth
          disabled={pending || !hub.todayMood}
          onClick={() =>
            startTransition(async () => {
              if (hub.todayMood) {
                await saveChallengeDailyCheckInAction(hub.challengeId, hub.todayMood, note);
              }
            })
          }
        >
          Save check-in
        </Button>
      </Card>
    </>
  );
}

function ActivityRow({
  challengeId,
  scheduleItemId,
  completedOn,
  act,
  pending,
  startTransition,
  onActChange,
  editable = true,
}: {
  challengeId: string;
  scheduleItemId: string;
  completedOn: string;
  act: HubActivityState;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
  onActChange: (patch: Partial<HubActivityState>) => void;
  editable?: boolean;
}) {
  const [steps, setSteps] = useState(
    act.progressNumber != null ? String(act.progressNumber) : "",
  );

  if (act.kind === "walking" && act.targetNumber) {
    const current = act.progressNumber ?? (steps ? Number(steps) : 0);
    const target = act.targetNumber;
    const pct = Math.min(100, Math.round((current / target) * 100));
    return (
      <div>
        <p className="font-medium">{act.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {current.toLocaleString()} / {target.toLocaleString()} steps
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="number"
          min={0}
          placeholder="Enter steps manually"
          value={steps}
          disabled={pending}
          onChange={(e) => setSteps(e.target.value)}
          className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
        />
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            className="min-h-10 flex-1 px-3 text-sm"
            disabled={pending || !steps || !editable}
            onClick={() =>
              startTransition(async () => {
                const n = Number(steps);
                await saveChallengeStepProgressAction(
                  challengeId,
                  scheduleItemId,
                  act.key,
                  n,
                  target,
                  completedOn,
                );
                onActChange({ progressNumber: n, completed: n >= target });
              })
            }
          >
            Save steps
          </Button>
          <Button
            type="button"
            variant={act.completed ? "secondary" : "outline"}
            disabled={pending || !editable}
            onClick={() =>
              startTransition(async () => {
                await toggleChallengeScheduleCompletionAction(
                  challengeId,
                  scheduleItemId,
                  !act.completed,
                  act.key,
                  act.completed ? null : target,
                  completedOn,
                );
                onActChange({ completed: !act.completed });
              })
            }
          >
            {act.completed ? "✓ Done" : "Mark complete"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending || !editable}
      onClick={() =>
        startTransition(async () => {
          await toggleChallengeScheduleCompletionAction(
            challengeId,
            scheduleItemId,
            !act.completed,
            act.key,
            undefined,
            completedOn,
          );
          onActChange({ completed: !act.completed });
        })
      }
      className="flex w-full items-start gap-3 text-left disabled:opacity-50"
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-sm">
        {act.completed ? "✓" : "○"}
      </span>
      <span className="font-medium">{act.title}</span>
    </button>
  );
}

function TabPanels({
  hub,
  tab,
  viewerUserId = null,
  pending = false,
  startTransition,
  onMutate,
}: {
  hub: ChallengeParticipantHub;
  tab: TabId;
  viewerUserId?: string | null;
  pending?: boolean;
  startTransition?: (fn: () => Promise<void>) => void;
  onMutate?: (h: ChallengeParticipantHub) => void;
}) {
  if (tab === "progress") {
    const { done: habitsDone, total: habitsTotal } = habitProgressStats(hub);
    const canEdit = hub.phase === "active" && Boolean(startTransition && onMutate);
    return (
      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">Your progress</h2>
          <p className="text-sm text-muted-foreground">
            Day {hub.dayIndex} of {hub.totalDays} · {habitsDone} of {habitsTotal} habits checked
            off (through today)
          </p>
          {hub.streakDays > 0 ? (
            <p className="mt-1 text-sm">🔥 {hub.streakDays}-day consistency streak</p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            Tap each habit to mark it done. Use Today for a focused view of what&apos;s due now.
          </p>
        </div>
        <div className="max-h-[min(520px,55vh)] space-y-2 overflow-y-auto pr-1">
          {hub.scheduleDays.map((day) => {
            const isFuture = day.completedOn > hub.todayKey;
            const isToday = day.completedOn === hub.todayKey;
            const editable = canEdit && !isFuture && !day.isRest;
            return (
              <details
                key={day.dayIndex}
                open={isToday || day.allComplete}
                className={`rounded-xl border px-3 py-2 ${
                  day.allComplete ? "border-primary/30 bg-primary/5" : "border-border"
                }`}
              >
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">
                      {day.dayLabel}
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {formatPlanDate(day.completedOn)}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {day.isRest
                        ? "Rest"
                        : isFuture
                          ? "Upcoming"
                          : day.allComplete
                            ? "All done"
                            : `${day.activities.filter((a) => a.completed).length}/${day.activities.length}`}
                    </span>
                  </div>
                </summary>
                <div className="mt-2 space-y-2 border-t border-border pt-2">
                  {day.isRest ? (
                    <p className="text-sm text-muted-foreground">Rest / recovery — no habits to check off.</p>
                  ) : (
                    day.activities.map((act) => (
                      <div key={act.key} className="rounded-lg border border-border p-2">
                        <ActivityRow
                          challengeId={hub.challengeId}
                          scheduleItemId={day.scheduleItemId}
                          completedOn={day.completedOn}
                          act={act}
                          pending={pending}
                          startTransition={startTransition ?? (() => {})}
                          editable={editable}
                          onActChange={(patch) =>
                            onMutate?.(
                              patchHubActivity(
                                hub,
                                day.scheduleItemId,
                                day.completedOn,
                                act.key,
                                patch,
                              ),
                            )
                          }
                        />
                      </div>
                    ))
                  )}
                </div>
              </details>
            );
          })}
        </div>
        <div>
          <h3 className="text-sm font-semibold">Milestones</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {hub.milestones.map((m) => (
              <li key={m.key} className={m.earned ? "text-foreground" : "text-muted-foreground"}>
                {m.label} {m.earned ? "" : "— keep going"}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    );
  }

  if (tab === "members") {
    return (
      <section aria-labelledby="challenge-members-heading">
        <h2 id="challenge-members-heading" className="mb-2 text-base font-semibold">
          {hub.members.length.toLocaleString()} member{hub.members.length === 1 ? "" : "s"}
        </h2>
        {hub.members.length === 0 ? (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">
              No one has joined yet. Share your invite link to grow the group.
            </p>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {hub.members.map((member) => (
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
                      {viewerUserId === member.id ? (
                        <span className="font-normal text-muted-foreground"> (you)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.role === "host" ? "Host" : "Participant"}
                      {member.checkedInToday ? " · Checked in today" : ""}
                      {member.progressPercent != null && member.role !== "host"
                        ? ` · ${member.progressPercent}% progress`
                        : ""}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (tab === "plan") {
    const weeks = groupByWeekTheme(hub.schedule);
    return (
      <div className="space-y-3">
        {weeks.map((w) => (
          <Card key={w.label} padding="sm">
            <h3 className="font-semibold">{w.label}</h3>
            {w.theme ? <p className="mt-1 text-sm text-muted-foreground">{w.theme}</p> : null}
            <ul className="mt-2 space-y-3 text-sm">
              {w.items.map((item) => {
                const habits = planHabitTitles(hub, item);
                return (
                  <li key={item.id}>
                    <p className="font-medium">{item.dayLabel}</p>
                    {item.isRest ? (
                      <p className="text-muted-foreground">{item.title || "Rest day"}</p>
                    ) : (
                      <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-muted-foreground">
                        {habits.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
        {weeks.length === 0 ? (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">
              Your creator hasn&apos;t published a day-by-day plan yet. Check updates for guidance.
            </p>
          </Card>
        ) : null}
      </div>
    );
  }

  if (tab === "updates") {
    return (
      <ul className="space-y-2">
        {hub.announcements.length === 0 ? (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">No updates yet from {hub.creatorName}.</p>
          </Card>
        ) : (
          hub.announcements.map((a) => (
            <li key={a.id}>
              <Card padding="sm">
                <p className="font-semibold">{hub.creatorName}</p>
                <p className="mt-1 font-medium">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(a.publishAt).toLocaleDateString()}
                </p>
              </Card>
            </li>
          ))
        )}
      </ul>
    );
  }

  if (tab === "about") {
    return (
      <Card className="space-y-3 overflow-hidden p-0">
        {hub.coverUrl ? (
          <div className="relative aspect-[2/1] bg-muted">
            <Image src={hub.coverUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">Hosted by {hub.creatorName}</p>
          {hub.shortDescription ? <p className="font-medium">{hub.shortDescription}</p> : null}
          <p className="text-sm text-muted-foreground">{hub.description}</p>
          {hub.goalDescription ? (
            <p className="text-sm">
              <span className="font-medium">What you&apos;ll do: </span>
              {hub.goalDescription}
            </p>
          ) : null}
          <p className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5" aria-hidden />
              {hub.startDate} → {hub.endDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {hub.participants} joined
            </span>
          </p>
          <Link
            href={`/challenges/${hub.challengeId}?tab=members`}
            className="inline-flex text-sm font-semibold text-primary"
          >
            See all members →
          </Link>
          <Link href="/community-guidelines" className="text-sm font-medium text-primary">
            Community guidelines
          </Link>
          {hub.communitySlug ? (
            <Link
              href={`/creator/${hub.communitySlug}`}
              className="block text-sm font-semibold text-primary"
            >
              View creator community →
            </Link>
          ) : null}
        </div>
      </Card>
    );
  }

  return null;
}

function planHabitTitles(
  hub: ChallengeParticipantHub,
  item: ChallengeParticipantHub["schedule"][0],
): string[] {
  return parseScheduleItemActivities(
    item.id,
    item.title,
    item.body,
    item.isRest,
    hub.category,
  ).map((a) => a.title);
}

function formatPlanDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isRequiredHubActivity(a: HubActivityState) {
  return a.kind !== "custom" || a.key === "primary";
}

function habitProgressStats(hub: ChallengeParticipantHub) {
  let done = 0;
  let total = 0;
  for (const day of hub.scheduleDays) {
    if (day.isRest || day.completedOn > hub.todayKey) continue;
    for (const act of day.activities.filter(isRequiredHubActivity)) {
      total += 1;
      if (act.completed) done += 1;
    }
  }
  return { done, total: Math.max(total, 1) };
}

function patchHubActivity(
  hub: ChallengeParticipantHub,
  scheduleItemId: string,
  completedOn: string,
  activityKey: string,
  patch: Partial<HubActivityState>,
): ChallengeParticipantHub {
  const scheduleDays = hub.scheduleDays.map((day) => {
    if (day.scheduleItemId !== scheduleItemId || day.completedOn !== completedOn) return day;
    const activities = day.activities.map((a) =>
      a.key === activityKey ? { ...a, ...patch } : a,
    );
    const allComplete =
      !day.isRest &&
      activities.filter(isRequiredHubActivity).every((a) => a.completed) &&
      activities.some(isRequiredHubActivity);
    return { ...day, activities, allComplete };
  });

  const dayCompletionMap = { ...hub.dayCompletionMap };
  for (const day of scheduleDays) {
    dayCompletionMap[day.dayIndex] = day.allComplete;
  }
  const completedDaysCount = Object.values(dayCompletionMap).filter(Boolean).length;

  let todayActivities = hub.todayActivities;
  if (completedOn === hub.todayKey && hub.scheduleItemId === scheduleItemId) {
    todayActivities = hub.todayActivities.map((a) =>
      a.key === activityKey ? { ...a, ...patch } : a,
    );
  }

  const milestones = [
    { key: "first_day", label: "🏆 First day completed", earned: completedDaysCount >= 1 },
    { key: "streak_7", label: "🔥 7 consistent days", earned: hub.bestStreak >= 7 },
    {
      key: "halfway",
      label: "⭐ Halfway there",
      earned: completedDaysCount >= Math.floor(hub.totalDays / 2),
    },
    {
      key: "complete",
      label: "🏁 Challenge completed",
      earned: hub.phase === "completed" && completedDaysCount >= Math.floor(hub.totalDays * 0.5),
    },
  ];

  return {
    ...hub,
    scheduleDays,
    dayCompletionMap,
    completedDaysCount,
    todayActivities,
    milestones,
  };
}

function groupByWeekTheme(schedule: ChallengeParticipantHub["schedule"]) {
  const groups: Array<{ label: string; theme: string | null; items: typeof schedule }> = [];
  let current: (typeof groups)[0] | null = null;
  for (const item of schedule) {
    const weekLabel = item.weekTheme || "Your challenge plan";
    if (!current || current.label !== weekLabel) {
      current = { label: weekLabel, theme: item.weekTheme, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  if (groups.length === 1 && groups[0].label === "Your challenge plan") {
    groups[0].label = "Full schedule";
  }
  return groups;
}
