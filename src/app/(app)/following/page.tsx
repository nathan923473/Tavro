import { FollowingInteractive } from "@/components/creator/following-interactive";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Following",
};

export default function FollowingPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Following"
        subtitle="Creators you follow · free"
      />
      <div className="space-y-3 px-4 py-4">
        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            Following a community does not auto-enrol you in challenges. Join
            each challenge when you&apos;re ready.
          </p>
        </Card>
        <FollowingInteractive />
      </div>
    </div>
  );
}
