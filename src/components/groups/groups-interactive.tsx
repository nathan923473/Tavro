"use client";

import {
  createAccountabilityGroupAction,
  requestJoinGroupByInviteCodeAction,
  type GroupJoinMode,
} from "@/app/(app)/groups/actions";
import { GroupDiscoveryPanel } from "@/components/groups/group-discovery-panel";
import { GroupHubView } from "@/components/groups/group-hub-view";
import { GroupPendingJoinCard } from "@/components/groups/group-pending-join-card";
import { GroupsMotivationBanner } from "@/components/groups/groups-motivation-banner";
import type { PendingGroupJoin } from "@/lib/data/groups";
import {
  GROUP_CHECK_IN_FREQUENCY_OPTIONS,
  GROUP_VISIBILITY_OPTIONS,
  type DiscoverableGroupCard,
  type GroupCheckInFrequency,
  type GroupVisibility,
} from "@/lib/groups/discovery";
import { GROUP_FOCUS_OPTIONS } from "@/lib/groups/focus-labels";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ACCOUNTABILITY_GROUP_MAX_MEMBERS,
  ACCOUNTABILITY_GROUP_SINGULAR,
  ACCOUNTABILITY_GROUP_SIZE_LABEL,
  ACCOUNTABILITY_GROUP_SIZE_RECOMMENDATION,
} from "@/lib/copy/accountability-groups";
import type { AccountabilityGroup, GroupActivity, GroupFocusType } from "@/types";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function GroupsInteractive({
  group,
  feed,
  loggedIn,
  viewerUserId = null,
  pendingJoin = null,
  existingGroupBlocked = false,
  discoveryEligible = false,
  initialDiscoverableGroups = [],
}: {
  group: AccountabilityGroup | null;
  feed: GroupActivity[];
  loggedIn: boolean;
  viewerUserId?: string | null;
  pendingJoin?: PendingGroupJoin | null;
  existingGroupBlocked?: boolean;
  discoveryEligible?: boolean;
  initialDiscoverableGroups?: DiscoverableGroupCard[];
}) {
  const router = useRouter();
  const createFormRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupFocus, setNewGroupFocus] = useState<GroupFocusType>("general");
  const [newGroupFocusCustom, setNewGroupFocusCustom] = useState("");
  const [newGroupSharedGoal, setNewGroupSharedGoal] = useState("");
  const [joinMode, setJoinMode] = useState<GroupJoinMode>("approval");
  const [visibility, setVisibility] = useState<GroupVisibility>("private");
  const [checkInFrequency, setCheckInFrequency] = useState<GroupCheckInFrequency>("flexible");
  const [discoveryBlurb, setDiscoveryBlurb] = useState("");

  const noGroupUiBlocked = Boolean(pendingJoin) || existingGroupBlocked;

  if (!loggedIn) {
    return (
      <div className="space-y-4">
        <GroupsMotivationBanner />
        <Card>
          <p className="text-sm text-muted-foreground">
            Log in to create or join a {ACCOUNTABILITY_GROUP_SINGULAR} (
            {ACCOUNTABILITY_GROUP_SIZE_LABEL.toLowerCase()}).
          </p>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <GroupsMotivationBanner
          onCreateClick={() =>
            createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />

        {pendingJoin ? <GroupPendingJoinCard pendingJoin={pendingJoin} /> : null}

        <GroupDiscoveryPanel
          eligible={discoveryEligible}
          initialGroups={initialDiscoverableGroups}
          hasPendingJoin={Boolean(pendingJoin)}
          disabled={noGroupUiBlocked}
          onScrollToCreate={() =>
            createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />

        {existingGroupBlocked && !pendingJoin ? (
          <Card className="border-primary/30 bg-primary/5">
            <h2 className="font-semibold">Your group is already set up</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We found an existing {ACCOUNTABILITY_GROUP_SINGULAR} on your account, but the page
              could not load it yet. Refresh below — if it still fails, your database may need
              migration <span className="font-mono text-xs">030_group_hub_viewer_access.sql</span>.
            </p>
            <Button
              type="button"
              className="mt-3"
              fullWidth
              onClick={() => router.refresh()}
            >
              Refresh my group
            </Button>
          </Card>
        ) : null}

        <div ref={createFormRef}>
        <Card
          className={
            pendingJoin || existingGroupBlocked ? "pointer-events-none opacity-60" : undefined
          }
        >
          <h2 className="font-semibold">Create a {ACCOUNTABILITY_GROUP_SINGULAR}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingJoin
              ? `Finish or cancel your pending join request before creating a new ${ACCOUNTABILITY_GROUP_SINGULAR}.`
              : `${ACCOUNTABILITY_GROUP_SIZE_LABEL} · private invite link & code`}
          </p>
          <label className="mt-3 block text-sm">
            <span className="font-medium">Group name</span>
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Morning Movers"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">{ACCOUNTABILITY_GROUP_SIZE_RECOMMENDATION}</p>
          <label className="mt-3 block text-sm">
            <span className="font-medium">What is this group mainly about?</span>
            <select
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={newGroupFocus}
              onChange={(e) => setNewGroupFocus(e.target.value as GroupFocusType)}
            >
              {GROUP_FOCUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {newGroupFocus === "custom" ? (
            <label className="mt-3 block text-sm">
              <span className="font-medium">Your custom focus</span>
              <input
                value={newGroupFocusCustom}
                onChange={(e) => setNewGroupFocusCustom(e.target.value)}
                placeholder="e.g. Postpartum strength, Couch to 5K, Desk-break stretches"
                className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
              />
            </label>
          ) : null}
          <label className="mt-3 block text-sm">
            <span className="font-medium">Group description</span>
            <textarea
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              placeholder="Who is this group for and how will you support each other?"
              rows={2}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="font-medium">Optional shared group goal</span>
            <input
              value={newGroupSharedGoal}
              onChange={(e) => setNewGroupSharedGoal(e.target.value)}
              placeholder="e.g. Walk regularly, exercise 3× weekly, sustainable routines"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="font-medium">Group visibility</span>
            <select
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={visibility}
              onChange={(e) => {
                const next = e.target.value as GroupVisibility;
                setVisibility(next);
                if (next === "discoverable") setJoinMode("approval");
              }}
            >
              {GROUP_VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted-foreground">
              {GROUP_VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.description}
            </span>
          </label>
          {visibility === "discoverable" ? (
            <>
              <label className="mt-3 block text-sm">
                <span className="font-medium">Check-in rhythm (for discovery)</span>
                <select
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  value={checkInFrequency}
                  onChange={(e) =>
                    setCheckInFrequency(e.target.value as GroupCheckInFrequency)
                  }
                >
                  {GROUP_CHECK_IN_FREQUENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-medium">Short description for discovery</span>
                <textarea
                  value={discoveryBlurb}
                  onChange={(e) => setDiscoveryBlurb(e.target.value)}
                  placeholder="Who is this group for? Keep it general — no private details."
                  rows={2}
                  maxLength={280}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                />
              </label>
            </>
          ) : null}
          <label className="mt-3 block text-sm">
            <span className="font-medium">Who can join with an invite?</span>
            <select
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={joinMode}
              disabled={visibility === "discoverable"}
              onChange={(e) => setJoinMode(e.target.value as GroupJoinMode)}
            >
              <option value="approval">Owner approval required</option>
              <option value="auto">Anyone with a valid invite joins automatically</option>
            </select>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            Maximum {ACCOUNTABILITY_GROUP_MAX_MEMBERS} members
          </p>
          <Button
            className="mt-3"
            fullWidth
            disabled={
              pending ||
              Boolean(pendingJoin) ||
              existingGroupBlocked ||
              (newGroupFocus === "custom" && newGroupFocusCustom.trim().length < 2)
            }
            onClick={() =>
              startTransition(async () => {
                try {
                  await createAccountabilityGroupAction({
                    name: newGroupName.trim() || "My group",
                    description: newGroupDescription.trim(),
                    focusType: newGroupFocus,
                    focusCustomLabel:
                      newGroupFocus === "custom" ? newGroupFocusCustom.trim() : undefined,
                    sharedGoal: newGroupSharedGoal.trim(),
                    joinMode,
                    visibility,
                    checkInFrequency,
                    discoverySummary:
                      discoveryBlurb.trim() || newGroupDescription.trim(),
                  });
                  setStatus("Your group is ready — invite a few friends who share your goals.");
                  router.refresh();
                } catch (e) {
                  setStatus(e instanceof Error ? e.message : "Failed");
                }
              })
            }
          >
            Create {ACCOUNTABILITY_GROUP_SINGULAR}
          </Button>
        </Card>
        </div>

        <Card>
          <h2 className="font-semibold">Join with a code</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingJoin
              ? "Cancel your pending request above to join a different group, or wait for approval."
              : "Enter a code from a friend"}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ABC123"
              className="flex-1 rounded-xl border border-border px-3 py-2 text-sm uppercase"
            />
            <Button
              variant="secondary"
              disabled={pending || !joinCode.trim() || Boolean(pendingJoin)}
              onClick={() =>
                startTransition(async () => {
                  try {
                    const result = await requestJoinGroupByInviteCodeAction(joinCode.trim());
                    setStatus(result.message);
                    router.refresh();
                  } catch (e) {
                    setStatus(e instanceof Error ? e.message : "Failed");
                  }
                })
              }
            >
              Join
            </Button>
          </div>
        </Card>

        {status ? (
          <p
            className={
              /failed|leave|invalid|full|migration/i.test(status)
                ? "text-sm text-red-600"
                : "text-sm text-muted-foreground"
            }
            role="status"
          >
            {status}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <GroupHubView
      group={group}
      feed={feed}
      viewerUserId={viewerUserId}
      discoveryOwnerEligible={discoveryEligible}
    />
  );
}
