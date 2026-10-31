import type { AccountRole } from "@/lib/auth/profile";

export function canSeeCreatorStudio(role: AccountRole | null | undefined) {
  return role === "creator" || role === "admin";
}
