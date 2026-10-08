export type GroupMemberRow = { user_id: string; joined_at: string };

/** Pick the longest-tenured member other than the departing user to own the group. */
export function pickAccountabilityGroupSuccessor(
  members: GroupMemberRow[],
  departingUserId: string,
): string | null {
  const others = members
    .filter((m) => m.user_id !== departingUserId)
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at));
  return others[0]?.user_id ?? null;
}
