import { getCurrentUserProfile } from "@/lib/auth/profile";
import { redirect } from "next/navigation";

export async function requireAdmin(nextPath = "/admin/creator-applications") {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (profile?.role !== "admin") {
    redirect("/profile?error=admin_only");
  }
  return { user, profile: profile! };
}
