"use client";

import { requestDiscoveryGroupJoinAction } from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  discoveryJoinErrorMessage,
  GROUP_CHECK_IN_FREQUENCY_OPTIONS,
  type DiscoverableGroupCard,
  type GroupCheckInFrequency,
} from "@/lib/groups/discovery";
import { GROUP_FOCUS_OPTIONS, groupFocusLabel } from "@/lib/groups/focus-labels";
import { ACCOUNTABILITY_GROUP_MAX_MEMBERS } from "@/lib/copy/accountability-groups";
import type { GroupFocusType } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { userFacingErrorMessage } from "@/lib/errors/user-message";

export function GroupDiscoveryPanel({
  eligible,
  initialGroups,
  hasPendingJoin,
  onScrollToCreate,
  disabled,
}: {
  eligible: boolean;
  initialGroups: DiscoverableGroupCard[];
  hasPendingJoin: boolean;
  onScrollToCreate?: () => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [focus, setFocus] = useState<GroupFocusType | "">("");
  const [frequency, setFrequency] = useState<GroupCheckInFrequency | "">("");
  const [groups, setGroups] = useState(initialGroups);
  const [status, setStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<"chooser" | "find">("chooser");

  if (mode === "chooser") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Card className="space-y-2 border-primary/20">
          <h2 className="font-semibold text-foreground">Create a group</h2>
          <p className="text-sm text-muted-foreground">
            Start a private accountability group and invite people you know.
          </p>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={disabled}
            onClick={() => onScrollToCreate?.()}
          >
            Create a group ↓
          </Button>
        </Card>
        <Card className="space-y-2 border-primary/30 bg-primary/5">
          <h2 className="font-semibold text-foreground">Find a group</h2>
          <p className="text-sm text-muted-foreground">
            Join a small group of people working toward similar goals.
          </p>
          <Button type="button" fullWidth disabled={disabled} onClick={() => setMode("find")}>
            Find an accountability group
          </Button>
        </Card>
      </div>
    );
  }

  if (!eligible) {
    return (
      <Card className="border-dashed border-primary/30 bg-secondary/20 space-y-3">
        <h2 className="font-semibold">Find an accountability group</h2>
        <p className="text-sm text-muted-foreground">
          To keep groups safe, discovery with people you don&apos;t know is limited to{" "}
          <strong className="font-medium text-foreground">verified adults (18+)</strong>. Tavro
          does not use an unverified checkbox for this — your account needs an age-assurance step
          before discovery opens.
        </p>
        <p className="text-sm text-muted-foreground">
          You can still <strong className="font-medium">create a group</strong> and invite friends
          with a code, or join with an invite below.
        </p>
        <Button type="button" variant="secondary" onClick={() => setMode("chooser")}>
          ← Back
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 border-primary/20">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">Find an accountability group</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Only groups that opted in · max {ACCOUNTABILITY_GROUP_MAX_MEMBERS} members · no private
            chat or check-ins shown here
          </p>
        </div>
        <Button type="button" variant="ghost" className="shrink-0 text-xs" onClick={() => setMode("chooser")}>
          Back
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs">
          <span className="font-medium text-muted-foreground">Goal (optional filter)</span>
          <select
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={focus}
            onChange={(e) => setFocus(e.target.value as GroupFocusType | "")}
          >
            <option value="">Any goal</option>
            {GROUP_FOCUS_OPTIONS.filter((o) => o.value !== "custom").map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-medium text-muted-foreground">Check-in rhythm</span>
          <select
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as GroupCheckInFrequency | "")}
          >
            <option value="">Any</option>
            {GROUP_CHECK_IN_FREQUENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await fetch("/api/groups/discover?" + new URLSearchParams({
              ...(focus ? { focus } : {}),
              ...(frequency ? { frequency } : {}),
            }));
            if (res.ok) {
              const json = (await res.json()) as { groups: DiscoverableGroupCard[] };
              setGroups(json.groups);
            }
          })
        }
      >
        Update matches
      </Button>

      {groups.length === 0 ? (
        <p className="rounded-xl bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
          No matching groups available yet. Try another goal or create your own group below.
        </p>
      ) : (
        <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {groups.map((g) => (
            <li key={g.id}>
              <Card padding="sm" className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{g.name}</p>
                    <p className="text-xs text-primary">
                      {groupFocusLabel(g.focusType, g.focusCustomLabel)}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {g.memberCount}/{g.maxMembers}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {GROUP_CHECK_IN_FREQUENCY_OPTIONS.find((o) => o.value === g.checkInFrequency)
                    ?.label ?? "Flexible check-ins"}
                </p>
                {g.discoverySummary ? (
                  <p className="text-sm text-muted-foreground">{g.discoverySummary}</p>
                ) : null}
                <Button
                  type="button"
                  fullWidth
                  disabled={pending || hasPendingJoin}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        const result = await requestDiscoveryGroupJoinAction(g.id);
                        setStatus(
                          userFacingErrorMessage(result.message, discoveryJoinErrorMessage("unknown")),
                        );
                        router.refresh();
                      } catch (e) {
                        setStatus(
                          userFacingErrorMessage(e, discoveryJoinErrorMessage("unknown")),
                        );
                      }
                    })
                  }
                >
                  Request to join
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {status ? (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </Card>
  );
}
