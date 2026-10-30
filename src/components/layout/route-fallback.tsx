import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export function RouteFallback({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="animate-fade-up">
      <PageHeader title={title} subtitle={subtitle} />
      <PageSkeleton />
    </div>
  );
}

/** Segment-level loading UI — no hard-coded page title (avoids “Home” flash). */
export function AppSegmentLoading() {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-label="Loading">
      <div className="border-b border-border/60 bg-surface/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>
      <PageSkeleton />
    </div>
  );
}
