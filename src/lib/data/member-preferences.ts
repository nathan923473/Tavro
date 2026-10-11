import { createClient } from "@/lib/supabase/server";
import {
  isGrowthFriction,
  isWorkTowards,
  type MemberGoalPreferences,
} from "@/lib/member/preferences";

export async function fetchMemberGoalPreferences(
  userId: string,
): Promise<MemberGoalPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("work_towards, growth_friction")
    .eq("id", userId)
    .maybeSingle();

  if (error && /work_towards|growth_friction|schema cache/i.test(error.message)) {
    return { workTowards: null, growthFriction: null };
  }

  const workRaw = data?.work_towards;
  const frictionRaw = data?.growth_friction;

  return {
    workTowards:
      typeof workRaw === "string" && isWorkTowards(workRaw) ? workRaw : null,
    growthFriction:
      typeof frictionRaw === "string" && isGrowthFriction(frictionRaw)
        ? frictionRaw
        : null,
  };
}
