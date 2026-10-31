import type { PersonalGoal } from "@/types";

export type HabitOverrides = Readonly<Record<string, boolean>>;

type Snapshot = {
  overrides: HabitOverrides;
  epoch: number;
};

const EMPTY: HabitOverrides = {};
const SERVER_SNAPSHOT: Snapshot = { overrides: EMPTY, epoch: 0 };
let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
const latestTicket = new Map<string, number>();
const chains = new Map<string, Promise<void>>();
let ticket = 0;

function emit(overrides: HabitOverrides = snapshot.overrides) {
  snapshot = { overrides, epoch: snapshot.epoch + 1 };
  for (const listener of listeners) listener();
}

export function getHabitOverrideSnapshot(): Snapshot {
  return snapshot;
}

export function getServerHabitOverrideSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

export function subscribeHabitOverrides(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setHabitOverride(goalId: string, done: boolean) {
  if (snapshot.overrides[goalId] === done) return;
  emit({ ...snapshot.overrides, [goalId]: done });
}

export function clearHabitOverride(goalId: string) {
  if (!(goalId in snapshot.overrides)) return;
  const next = { ...snapshot.overrides };
  delete next[goalId];
  emit(Object.keys(next).length === 0 ? EMPTY : next);
}

export function applyHabitOverrides(goals: PersonalGoal[], overrides: HabitOverrides): PersonalGoal[] {
  let changed = false;
  const next = goals.map((goal) => {
    if (goal.id in overrides && overrides[goal.id] !== goal.completedToday) {
      changed = true;
      return { ...goal, completedToday: overrides[goal.id] };
    }
    return goal;
  });
  return changed ? next : goals;
}

/**
 * Paint `done` immediately, then send that exact state. A newer tap replaces
 * an older in-flight save so the checkbox does not snap back.
 */
export function queueHabitCompletion(
  goalId: string,
  done: boolean,
  write: (goalId: string, done: boolean) => Promise<void>,
): Promise<boolean> {
  setHabitOverride(goalId, done);
  const myTicket = ++ticket;
  latestTicket.set(goalId, myTicket);

  const prev = chains.get(goalId) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(async (): Promise<boolean> => {
    if (latestTicket.get(goalId) !== myTicket) return false;
    try {
      await write(goalId, done);
      return latestTicket.get(goalId) === myTicket;
    } catch (error) {
      if (latestTicket.get(goalId) === myTicket) clearHabitOverride(goalId);
      throw error;
    }
  });

  chains.set(goalId, next.then(() => {}, () => {}));
  return next;
}
