import { DiscoverInteractive } from "@/components/discover/discover-interactive";
import { PageHeader } from "@/components/layout/page-header";
import { fetchDiscoverSections } from "@/lib/data/discover";

export const metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const sections = await fetchDiscoverSections();

  return (
    <div className="animate-fade-up pb-6">
      <PageHeader
        title="Discover"
        subtitle="Same search as the Challenges tab — browse everything in one place"
      />
      <div className="px-4 py-4">
        <DiscoverInteractive initial={sections} />
      </div>
    </div>
  );
}
