"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ChallengeFeedbackInput = {
  challengeId: string;
  rating: number;
  whatHelped?: string;
  whatImprove?: string;
  shareWrittenFeedback: boolean;
};

export async function submitChallengeFeedbackAction(
  input: ChallengeFeedbackInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, message: "Please choose a rating from 1 to 5." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to leave feedback." };

  const { data: member } = await supabase
    .from("challenge_participants")
    .select("user_id")
    .eq("challenge_id", input.challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return { ok: false, message: "Only challenge participants can submit feedback." };
  }

  const payload = {
    challenge_id: input.challengeId,
    user_id: user.id,
    rating: input.rating,
    what_helped: input.whatHelped?.trim().slice(0, 2000) || null,
    what_improve: input.whatImprove?.trim().slice(0, 2000) || null,
    share_written_feedback: input.shareWrittenFeedback,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("challenge_participant_feedback").upsert(payload, {
    onConflict: "challenge_id,user_id",
  });

  if (error) {
    if (/challenge_participant_feedback|schema cache/i.test(error.message)) {
      return {
        ok: false,
        message: "Feedback is not enabled yet — run migration 045_challenge_participant_feedback.sql.",
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(`/challenges/${input.challengeId}`);
  return { ok: true };
}

export async function fetchMyChallengeFeedback(challengeId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_participant_feedback")
    .select("rating, what_helped, what_improve, share_written_feedback")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}
