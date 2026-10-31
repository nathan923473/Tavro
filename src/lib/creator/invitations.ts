import { createClient } from "@/lib/supabase/server";
import type { InvitationPreviewState } from "@/lib/creator/onboarding-rules";

export type CreatorInvitationRow = {
  id: string;
  intended_email: string;
  note: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  revoked_at: string | null;
  created_at: string;
  created_by: string;
};

export type CreatorOnboardingFunnel = {
  invitationsCreated: number;
  invitationsAccepted: number;
  applications: number;
  approvals: number;
  firstChallengeCreated: number;
  firstChallengePublished: number;
  challengeShared: number;
  firstParticipantJoined: number;
};

export async function listCreatorInvitations(): Promise<CreatorInvitationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_creator_invitations");
  if (error) {
    if (/schema cache|could not find the function/i.test(error.message)) return [];
    throw error;
  }
  return (data ?? []) as CreatorInvitationRow[];
}

export async function previewCreatorInvitation(token: string): Promise<{
  state: InvitationPreviewState;
  expiresAt: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_creator_invitation", {
    p_token: token,
  });
  if (error || !data || typeof data !== "object") {
    return { state: "invalid", expiresAt: null };
  }
  const row = data as { state?: string; expiresAt?: string };
  const state = row.state;
  if (
    state === "ready" ||
    state === "used" ||
    state === "expired" ||
    state === "revoked" ||
    state === "invalid"
  ) {
    return { state, expiresAt: row.expiresAt ?? null };
  }
  return { state: "invalid", expiresAt: null };
}

export async function fetchCreatorOnboardingFunnel(): Promise<CreatorOnboardingFunnel | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("creator_onboarding_funnel_stats");
  if (error || !data || typeof data !== "object") return null;
  const row = data as Partial<CreatorOnboardingFunnel>;
  return {
    invitationsCreated: Number(row.invitationsCreated ?? 0),
    invitationsAccepted: Number(row.invitationsAccepted ?? 0),
    applications: Number(row.applications ?? 0),
    approvals: Number(row.approvals ?? 0),
    firstChallengeCreated: Number(row.firstChallengeCreated ?? 0),
    firstChallengePublished: Number(row.firstChallengePublished ?? 0),
    challengeShared: Number(row.challengeShared ?? 0),
    firstParticipantJoined: Number(row.firstParticipantJoined ?? 0),
  };
}
