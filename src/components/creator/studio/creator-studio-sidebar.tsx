import { CreatorStudioSidebarTab } from "@/components/creator/studio/creator-studio-sidebar-tab";
import { canSeeCreatorStudio } from "@/lib/auth/creator-access";
import { getCurrentUserProfile } from "@/lib/auth/profile";

/** Desktop sidebar tab. Members and guests render nothing. */
export async function CreatorStudioSidebar() {
  const { profile } = await getCurrentUserProfile();
  if (!canSeeCreatorStudio(profile?.role)) return null;
  return <CreatorStudioSidebarTab />;
}
