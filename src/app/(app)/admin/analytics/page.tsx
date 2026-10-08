import { FounderAnalyticsDashboard } from "@/components/admin/founder-analytics/founder-analytics-dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { fetchFounderAnalyticsSnapshot } from "@/lib/data/founder-analytics";

export const metadata = { title: "Founder analytics" };

type PageProps = {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
};

export default async function AdminFounderAnalyticsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const snapshot = await fetchFounderAnalyticsSnapshot({
    preset: params.preset,
    from: params.from,
    to: params.to,
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Founder analytics"
        subtitle="Platform health · admin only · UTC boundaries"
      />
      <div className="px-4 py-4">
        <FounderAnalyticsDashboard snapshot={snapshot} preset={params.preset ?? "30d"} />
      </div>
    </div>
  );
}
