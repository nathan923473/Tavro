import { PageHeader } from "@/components/layout/page-header";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted/80 ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function AppLoading() {
  return (
    <div className="animate-fade-up">
      <PageHeader title="Home" subtitle="Your daily accountability hub" />
      <div className="space-y-6 px-4 py-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}
