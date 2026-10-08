import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformEventType } from "@/lib/analytics/event-types";

export type RecordPlatformEventInput = {
  eventType: PlatformEventType;
  occurredAt?: Date;
  userId?: string | null;
  creatorId?: string | null;
  challengeId?: string | null;
  communityId?: string | null;
  sessionKey?: string | null;
  idempotencyKey?: string | null;
  properties?: Record<string, unknown>;
};

/** Inserts via service role; silently no-ops if admin client unavailable. */
export async function recordPlatformEvent(input: RecordPlatformEventInput): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const row = {
    event_type: input.eventType,
    occurred_at: (input.occurredAt ?? new Date()).toISOString(),
    user_id: input.userId ?? null,
    creator_id: input.creatorId ?? null,
    challenge_id: input.challengeId ?? null,
    community_id: input.communityId ?? null,
    session_key: input.sessionKey ?? null,
    idempotency_key: input.idempotencyKey ?? null,
    properties: input.properties ?? {},
  };

  const { error } = await admin.from("platform_analytics_events").insert(row);
  if (error && !/duplicate key|idempotency/i.test(error.message)) {
    console.warn("[analytics] recordPlatformEvent", error.message);
  }
}
