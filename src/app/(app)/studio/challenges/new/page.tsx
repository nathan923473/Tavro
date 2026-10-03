import { PageHeader } from "@/components/layout/page-header";
import { PublicChallengeForm } from "@/components/challenges/public-challenge-form";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";

export const metadata = { title: "New public challenge" };

export default async function NewPublicChallengePage() {
  await requireApprovedCreator();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Public challenge"
        subtitle="Published to discovery · free to join"
      />
      <div className="space-y-4 px-4 py-4">
        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            Only approved creators can publish here (enforced by database RLS).
            Members can create{" "}
            <a href="/challenges/create" className="font-medium text-primary">
              private challenges
            </a>{" "}
            instead.
          </p>
        </Card>
        <PublicChallengeForm />
      </div>
    </div>
  );
}
