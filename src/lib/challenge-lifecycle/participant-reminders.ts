import { createClient } from "@/lib/supabase/server";

const MS_DAY = 86_400_000;

type ReminderKind = "registered" | "starts_in_7d" | "starts_in_1d" | "started";

export async function scheduleParticipantChallengeReminders(input: {
  userId: string;
  challengeId: string;
  challengeTitle: string;
  startAt: Date;
  linkPath: string;
}) {
  const supabase = await createClient();
  const now = Date.now();
  const startMs = input.startAt.getTime();

  const rows: Array<{ kind: ReminderKind; send_at: string; title: string; body: string }> = [
    {
      kind: "registered",
      send_at: new Date(now).toISOString(),
      title: "You're registered!",
      body: `You're in for ${input.challengeTitle}. We'll remind you before it starts.`,
    },
  ];

  const sevenDays = startMs - 7 * MS_DAY;
  if (sevenDays > now) {
    rows.push({
      kind: "starts_in_7d",
      send_at: new Date(sevenDays).toISOString(),
      title: `${input.challengeTitle} starts in 7 days`,
      body: "Get ready — your challenge is one week away.",
    });
  }

  const oneDay = startMs - MS_DAY;
  if (oneDay > now) {
    rows.push({
      kind: "starts_in_1d",
      send_at: new Date(oneDay).toISOString(),
      title: `${input.challengeTitle} starts tomorrow`,
      body: "Tomorrow is day one. Open the challenge when you're ready.",
    });
  }

  if (startMs > now) {
    rows.push({
      kind: "started",
      send_at: input.startAt.toISOString(),
      title: `${input.challengeTitle} has started`,
      body: "Day 1 is live — open the challenge to check in.",
    });
  }

  for (const row of rows) {
    const { error: insErr } = await supabase.from("challenge_participant_reminders").upsert(
      {
        user_id: input.userId,
        challenge_id: input.challengeId,
        kind: row.kind,
        send_at: row.send_at,
        sent_at: null,
      },
      { onConflict: "user_id,challenge_id,kind", ignoreDuplicates: false },
    );
    if (insErr && !/challenge_participant_reminders|schema cache/i.test(insErr.message)) {
      console.error("scheduleParticipantChallengeReminders:", insErr.message);
      return;
    }

    if (row.kind === "registered") {
      try {
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("challenge_reminders")
          .eq("user_id", input.userId)
          .maybeSingle();
        if (prefs?.challenge_reminders === false) continue;

        await supabase.from("app_notifications").insert({
          user_id: input.userId,
          kind: "challenge_registered",
          title: row.title,
          body: row.body,
          link_path: input.linkPath,
        });
      } catch {
        /* optional until migration 016 */
      }
    }
  }
}
