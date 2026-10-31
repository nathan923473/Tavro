import { CreatorStudioSidebarNav } from "@/components/creator/studio/creator-studio-sidebar-nav";
import { canSeeCreatorStudio } from "@/lib/auth/creator-access";
import { getCurrentUserProfile } from "@/lib/auth/profile";

/** Desktop-only. Members and guests render nothing. */
export async function CreatorStudioSidebar() {
  const { profile } = await getCurrentUserProfile();
  if (!canSeeCreatorStudio(profile?.role)) return null;
  return <CreatorStudioSidebarNav />;
}
