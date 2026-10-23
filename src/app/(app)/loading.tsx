import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="animate-fade-up">
      <PageHeader title="Home" subtitle="Your daily accountability hub" />
      <PageSkeleton />
    </div>
  );
}
