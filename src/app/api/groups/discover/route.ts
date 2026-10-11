import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchDiscoverableGroups } from "@/lib/data/group-discovery";
import type { GroupCheckInFrequency } from "@/lib/groups/discovery";
import type { GroupFocusType } from "@/types";
import { NextResponse } from "next/server";

const FOCUS_VALUES = new Set([
  "walking",
  "gym",
  "nutrition",
  "weight_loss",
  "routines",
  "general",
  "custom",
]);

const FREQUENCY_VALUES = new Set(["daily", "weekdays", "weekly", "flexible"]);

export async function GET(request: Request) {
  const { user } = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const focusRaw = searchParams.get("focus") ?? "";
  const frequencyRaw = searchParams.get("frequency") ?? "";

  const focus =
    focusRaw && FOCUS_VALUES.has(focusRaw) ? (focusRaw as GroupFocusType) : "";
  const frequency =
    frequencyRaw && FREQUENCY_VALUES.has(frequencyRaw)
      ? (frequencyRaw as GroupCheckInFrequency)
      : "";

  const groups = await fetchDiscoverableGroups({
    focus,
    checkInFrequency: frequency,
  });

  return NextResponse.json({ groups });
}
