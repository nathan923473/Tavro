import { creatorSetupChecklist } from "@/lib/creator/onboarding-rules";
import { challengeInvitePath, publicChallengePath } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function loadCreatorSetup(userId: string, community: {
  slug: string;
  communityName: string;
  bio: string | null;
} | null) {
  const supabase = await createClient();
  const [challengesRes, profileRes] = await Promise.all([
    supabase
      .from("challenges")
      .select("id, title, publish_status, invite_slug")
      .eq("created_by", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("first_challenge_shared_at, creator_access_pathway")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const challenges = challengesRes.error ? [] : (challengesRes.data ?? []);
  const published = challenges.filter((row) => row.publish_status === "published");
  const draft = challenges.find((row) => row.publish_status !== "published");
  const shareTarget = published[0] ?? null;
  const sharePath = shareTarget?.invite_slug
    ? community?.slug
      ? publicChallengePath(community.slug, shareTarget.invite_slug)
      : challengeInvitePath(shareTarget.invite_slug)
    : null;

  const pathway = profileRes.error ? null : profileRes.data?.creator_access_pathway;
  const steps = creatorSetupChecklist({
    profileComplete: Boolean(community?.communityName.trim() && community.bio?.trim()),
    profileHref: community?.slug ? `/creator/${community.slug}/edit` : "/studio/community/setup",
    challengeCount: challenges.length,
    publishedCount: published.length,
    createHref: "/studio/challenges/new",
    publishHref: draft ? `/studio/challenges/${draft.id}` : "/studio/challenges",
    shareHref: sharePath,
    shared: Boolean(profileRes.data?.first_challenge_shared_at),
  });

  return {
    steps,
    welcome: pathway === "invite" ? ("invite" as const) : ("approved" as const),
    shareChallengeId: shareTarget?.id ?? null,
    sharePath,
    shareTitle: shareTarget?.title ?? null,
  };
}
