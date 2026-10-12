import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/profile";

export async function ProfilePhotoCard() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) return null;

  return (
    <div id="profile-photo">
    <Card className="border-primary/25 ring-1 ring-primary/10">
      <h2 className="text-lg font-semibold">Profile picture</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload a photo — shown on your account and in your private
        accountability group.
      </p>
      <div className="mt-4">
        <ProfileAvatarEditor
          userId={user.id}
          displayName={profile?.displayName ?? null}
          avatarUrl={profile?.avatarUrl ?? null}
        />
      </div>
    </Card>
    </div>
  );
}
