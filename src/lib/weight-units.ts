import type { WeightUnit } from "@/types";

const LB_TO_KG = 0.45359237;

export function convertWeight(
  value: number,
  from: WeightUnit,
  to: WeightUnit,
): number {
  if (from === to) return value;
  if (from === "lb" && to === "kg") return value * LB_TO_KG;
  return value / LB_TO_KG;
}

export function formatWeight(value: number, unit: WeightUnit): string {
  const decimals = unit === "kg" ? 1 : 1;
  return `${value.toFixed(decimals)} ${unit}`;
}

export const WEIGHT_UNIT_STORAGE_KEY = "streakly-weight-unit";

const unitListeners = new Set<() => void>();

export function subscribeWeightUnit(onStoreChange: () => void): () => void {
  unitListeners.add(onStoreChange);
  return () => unitListeners.delete(onStoreChange);
}

export function readStoredWeightUnit(): WeightUnit {
  if (typeof window === "undefined") return "kg";
  const stored = window.localStorage.getItem(WEIGHT_UNIT_STORAGE_KEY);
  return stored === "lb" ? "lb" : "kg";
}

export function storeWeightUnit(unit: WeightUnit): void {
  window.localStorage.setItem(WEIGHT_UNIT_STORAGE_KEY, unit);
  unitListeners.forEach((listener) => listener());
}
