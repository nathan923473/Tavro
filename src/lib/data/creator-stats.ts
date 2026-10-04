import { createClient } from "@/lib/supabase/server";

export async function fetchCreatorDashboardStats(ownerId: string) {
  const supabase = await createClient();

  const { data: community } = await supabase
    .from("creator_communities")
    .select("id, member_count_cache")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!community) {
    return {
      totalFollowers: 0,
      activeChallenges: 0,
      totalParticipants: 0,
      participationRatePercent: 0,
      periodLabel: "Last 30 days",
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, end_date")
    .eq("community_id", community.id);

  const activeChallenges =
    challenges?.filter((c) => c.end_date >= today).length ?? 0;

  let totalParticipants = 0;
  for (const c of challenges ?? []) {
    const { count } = await supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", c.id);
    totalParticipants += count ?? 0;
  }

  const { count: followers } = await supabase
    .from("community_follows")
    .select("*", { count: "exact", head: true })
    .eq("community_id", community.id);

  const totalFollowers = followers ?? community.member_count_cache ?? 0;
  const participationRatePercent =
    totalFollowers > 0
      ? Math.min(100, Math.round((totalParticipants / totalFollowers) * 100))
      : 0;

  return {
    totalFollowers,
    activeChallenges,
    totalParticipants,
    participationRatePercent,
    periodLabel: "Last 30 days",
  };
}
