import { PrivateChallengeForm } from "@/components/challenges/private-challenge-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Create private challenge" };

export default async function CreatePrivateChallengePage() {
  const { user } = await getCurrentUserProfile();
  if (!user) {
    redirect("/login?next=/challenges/create");
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Private challenge"
        subtitle="Invite-only · not in public discovery"
      />
      <div className="space-y-4 px-4 py-4">
        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            Share the invite link with friends. Only participants with the link can
            access this challenge (enforced by RLS when live).
          </p>
        </Card>
        <PrivateChallengeForm />
      </div>
    </div>
  );
}
