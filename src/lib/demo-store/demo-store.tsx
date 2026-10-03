"use client";

import {
  discoverChallenges,
  myChallenges,
  todaysGoals,
} from "@/lib/mock-data";
import { demoFollowingSlugs } from "@/lib/mock-creators";
import type { Challenge } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "streakly-demo-v1";

export type DemoStoreState = {
  joinedChallengeIds: string[];
  challengeProgress: Record<string, number>;
  followingSlugs: string[];
  inGroup: boolean;
  checkInDate: string | null;
  goalCompletion: Record<string, boolean>;
  goalsDate: string | null;
  feedReactions: Record<string, number>;
  feedReplied: Record<string, boolean>;
  groupChatSeen: boolean;
  weighIns: Array<{ date: string; weightLb: number }>;
  creatorAnnouncements: Record<string, string>;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function defaultState(): DemoStoreState {
  return {
    joinedChallengeIds: myChallenges.filter((c) => c.joined).map((c) => c.id),
    challengeProgress: Object.fromEntries(
      myChallenges.map((c) => [c.id, c.progressPercent]),
    ),
    followingSlugs: [...demoFollowingSlugs],
    inGroup: true,
    checkInDate: null,
    goalCompletion: Object.fromEntries(
      todaysGoals.map((g) => [g.id, g.completedToday]),
    ),
    goalsDate: todayKey(),
    feedReactions: {},
    feedReplied: {},
    groupChatSeen: false,
    weighIns: [],
    creatorAnnouncements: {},
  };
}

function normalizeState(raw: Partial<DemoStoreState>): DemoStoreState {
  const base = defaultState();
  const today = todayKey();
  const merged = { ...base, ...raw };
  if (merged.goalsDate !== today) {
    merged.goalCompletion = Object.fromEntries(
      todaysGoals.map((g) => [g.id, false]),
    );
    merged.goalsDate = today;
  }
  return merged;
}

function loadState(): DemoStoreState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw) as Partial<DemoStoreState>);
  } catch {
    return defaultState();
  }
}

function saveState(state: DemoStoreState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

type DemoStoreContextValue = {
  state: DemoStoreState;
  hydrated: boolean;
  joinChallenge: (id: string) => void;
  leaveChallenge: (id: string) => void;
  logChallengeActivity: (id: string) => void;
  toggleFollow: (slug: string) => void;
  isFollowing: (slug: string) => boolean;
  joinGroup: () => void;
  leaveGroup: () => void;
  checkInToday: () => void;
  hasCheckedInToday: () => boolean;
  toggleGoal: (goalId: string) => void;
  getGoals: () => typeof todaysGoals;
  reactToFeed: (feedId: string) => void;
  replyToFeed: (feedId: string) => void;
  getFeedReactionCount: (feedId: string, base: number) => number;
  isFeedReplied: (feedId: string) => boolean;
  openGroupChat: () => void;
  addWeighIn: (weightLb: number) => void;
  mergeChallenge: (challenge: Challenge) => Challenge;
  allChallenges: () => Challenge[];
  myChallengesList: () => Challenge[];
  discoverChallengesList: () => Challenge[];
  setCreatorAnnouncement: (slug: string, text: string) => void;
  getCreatorAnnouncement: (slug: string, fallback: string) => string;
  exportDemoData: () => string;
};

const DemoStoreContext = createContext<DemoStoreContextValue | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoStoreState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const update = useCallback((fn: (s: DemoStoreState) => DemoStoreState) => {
    setState((s) => normalizeState(fn(s)));
  }, []);

  const allChallengeSource = useMemo(
    () => [...myChallenges, ...discoverChallenges],
    [],
  );

  const mergeChallenge = useCallback(
    (challenge: Challenge): Challenge => {
      const joined = state.joinedChallengeIds.includes(challenge.id);
      const progress = state.challengeProgress[challenge.id] ?? 0;
      return {
        ...challenge,
        joined,
        progressPercent: joined ? Math.min(100, progress) : 0,
        participants: challenge.participants,
      };
    },
    [state.joinedChallengeIds, state.challengeProgress],
  );

  const value = useMemo<DemoStoreContextValue>(
    () => ({
      state,
      hydrated,
      joinChallenge: (id) =>
        update((s) => ({
          ...s,
          joinedChallengeIds: s.joinedChallengeIds.includes(id)
            ? s.joinedChallengeIds
            : [...s.joinedChallengeIds, id],
          challengeProgress: {
            ...s.challengeProgress,
            [id]: s.challengeProgress[id] ?? 5,
          },
        })),
      leaveChallenge: (id) =>
        update((s) => ({
          ...s,
          joinedChallengeIds: s.joinedChallengeIds.filter((x) => x !== id),
        })),
      logChallengeActivity: (id) =>
        update((s) => ({
          ...s,
          challengeProgress: {
            ...s.challengeProgress,
            [id]: Math.min(100, (s.challengeProgress[id] ?? 0) + 8),
          },
        })),
      toggleFollow: (slug) =>
        update((s) => ({
          ...s,
          followingSlugs: s.followingSlugs.includes(slug)
            ? s.followingSlugs.filter((x) => x !== slug)
            : [...s.followingSlugs, slug],
        })),
      isFollowing: (slug) => state.followingSlugs.includes(slug),
      joinGroup: () => update((s) => ({ ...s, inGroup: true })),
      leaveGroup: () => update((s) => ({ ...s, inGroup: false })),
      checkInToday: () =>
        update((s) => ({ ...s, checkInDate: todayKey() })),
      hasCheckedInToday: () => state.checkInDate === todayKey(),
      toggleGoal: (goalId) =>
        update((s) => ({
          ...s,
          goalsDate: todayKey(),
          goalCompletion: {
            ...s.goalCompletion,
            [goalId]: !s.goalCompletion[goalId],
          },
        })),
      getGoals: () =>
        todaysGoals.map((g) => ({
          ...g,
          completedToday: state.goalCompletion[g.id] ?? false,
        })),
      reactToFeed: (feedId) =>
        update((s) => ({
          ...s,
          feedReactions: {
            ...s.feedReactions,
            [feedId]: (s.feedReactions[feedId] ?? 0) + 1,
          },
        })),
      replyToFeed: (feedId) =>
        update((s) => ({
          ...s,
          feedReplied: { ...s.feedReplied, [feedId]: true },
        })),
      getFeedReactionCount: (feedId, base) =>
        base + (state.feedReactions[feedId] ?? 0),
      isFeedReplied: (feedId) => Boolean(state.feedReplied[feedId]),
      openGroupChat: () => update((s) => ({ ...s, groupChatSeen: true })),
      addWeighIn: (weightLb) =>
        update((s) => ({
          ...s,
          weighIns: [
            ...s.weighIns.filter((w) => w.date !== todayKey()),
            { date: todayKey(), weightLb },
          ],
        })),
      mergeChallenge,
      allChallenges: () => allChallengeSource.map(mergeChallenge),
      myChallengesList: () =>
        allChallengeSource
          .filter((c) => state.joinedChallengeIds.includes(c.id))
          .map(mergeChallenge),
      discoverChallengesList: () =>
        allChallengeSource
          .filter((c) => !state.joinedChallengeIds.includes(c.id))
          .map(mergeChallenge),
      setCreatorAnnouncement: (slug, text) =>
        update((s) => ({
          ...s,
          creatorAnnouncements: { ...s.creatorAnnouncements, [slug]: text },
        })),
      getCreatorAnnouncement: (slug, fallback) =>
        state.creatorAnnouncements[slug] ?? fallback,
      exportDemoData: () => JSON.stringify(state, null, 2),
    }),
    [state, hydrated, update, mergeChallenge, allChallengeSource],
  );

  return (
    <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) {
    throw new Error("useDemoStore must be used within DemoStoreProvider");
  }
  return ctx;
}
