import { getCurrentUserProfile } from "@/lib/auth/profile";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) {
    redirect("/login?next=/admin/creator-applications");
  }
  if (profile?.role !== "admin") {
    redirect("/profile?error=admin_only");
  }
  return { user, profile: profile! };
}
