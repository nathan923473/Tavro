import { BecomeCreatorForm } from "@/components/creator/become-creator-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Become a creator" };

export default async function BecomeCreatorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login?next=/become-creator");
  }

  if (profile?.role === "creator" || profile?.role === "admin") {
    redirect("/studio");
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Become a creator"
        subtitle="Manual approval · same login as members"
      />
      <div className="space-y-4 px-4 py-4">
        {params.error === "not_approved" ? (
          <Card className="border-amber-200 bg-amber-50/80">
            <p className="text-sm">
              Creator Studio requires approval. Apply below or keep enjoying member
              features.
            </p>
          </Card>
        ) : null}
        {params.submitted === "1" || profile?.creatorStatus === "pending" ? (
          <Card>
            <h2 className="font-semibold">Application pending</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our team is reviewing your application. You still have full member
              access.
            </p>
          </Card>
        ) : profile?.creatorStatus === "rejected" ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              Your previous application was not approved. Contact support to reapply.
            </p>
          </Card>
        ) : (
          <BecomeCreatorForm />
        )}
        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            Members can always create{" "}
            <Link href="/challenges/create" className="font-medium text-primary">
              private invite-only challenges
            </Link>{" "}
            without creator approval.
          </p>
        </Card>
      </div>
    </div>
  );
}
