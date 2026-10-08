"use client";

import { useEffect, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Set<Listener>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: Listener) {
  listeners.add(listener);
  if (intervalId == null && typeof window !== "undefined") {
    intervalId = setInterval(() => {
      for (const fn of listeners) fn();
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getMinuteSnapshot() {
  return Math.floor(Date.now() / 60_000);
}

/** Shared ~1/min tick for countdown UIs (one interval for all subscribers). */
export function useMinuteTicker(): number {
  return useSyncExternalStore(subscribe, getMinuteSnapshot, getMinuteSnapshot);
}
