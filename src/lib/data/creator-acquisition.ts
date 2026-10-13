import { createClient } from "@/lib/supabase/server";

export type CreatorAcquisitionStats = {
  totalApplications: number;
  fromCreatorReferral: number;
  fromCreatorLanding: number;
  approvedCreators: number;
  activeCreatorsWithPublishedChallenge: number;
  creatorsWithRepeatPublishedChallenge: number;
};

export async function fetchCreatorAcquisitionStats(): Promise<CreatorAcquisitionStats> {
  const supabase = await createClient();
  const empty: CreatorAcquisitionStats = {
    totalApplications: 0,
    fromCreatorReferral: 0,
    fromCreatorLanding: 0,
    approvedCreators: 0,
    activeCreatorsWithPublishedChallenge: 0,
    creatorsWithRepeatPublishedChallenge: 0,
  };

  const appsRes = await supabase
    .from("creator_applications")
    .select("id, application_source, referred_by_user_id, status", { count: "exact" });

  if (appsRes.error && /application_source|referred_by|schema cache/i.test(appsRes.error.message)) {
    const { count } = await supabase
      .from("creator_applications")
      .select("*", { count: "exact", head: true });
    return { ...empty, totalApplications: count ?? 0 };
  }

  const apps = appsRes.data ?? [];
  const totalApplications = appsRes.count ?? apps.length;

  const fromCreatorReferral = apps.filter(
    (a) => a.referred_by_user_id || a.application_source === "creator_referral",
  ).length;
  const fromCreatorLanding = apps.filter((a) => a.application_source === "creator_landing").length;

  const { count: approvedCreators } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("creator_status", "approved");

  const { data: publicChallenges } = await supabase
    .from("challenges")
    .select("created_by")
    .eq("visibility", "public")
    .in("publish_status", ["published", "scheduled", "archived"]);

  const byCreator = new Map<string, number>();
  for (const row of publicChallenges ?? []) {
    const id = row.created_by as string;
    byCreator.set(id, (byCreator.get(id) ?? 0) + 1);
  }

  let activeCreatorsWithPublishedChallenge = 0;
  let creatorsWithRepeatPublishedChallenge = 0;
  for (const count of byCreator.values()) {
    if (count >= 1) activeCreatorsWithPublishedChallenge += 1;
    if (count >= 2) creatorsWithRepeatPublishedChallenge += 1;
  }

  return {
    totalApplications,
    fromCreatorReferral,
    fromCreatorLanding,
    approvedCreators: approvedCreators ?? 0,
    activeCreatorsWithPublishedChallenge,
    creatorsWithRepeatPublishedChallenge,
  };
}

export async function fetchCreatorReferralApplicationCount(
  creatorUserId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("creator_applications")
    .select("*", { count: "exact", head: true })
    .eq("referred_by_user_id", creatorUserId);

  if (error) {
    if (/referred_by_user_id|schema cache/i.test(error.message)) return 0;
    return 0;
  }
  return count ?? 0;
}
