import { GroupsInteractive } from "@/components/groups/groups-interactive";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Groups",
};

export default function GroupsPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Groups"
        subtitle="Small circles, private encouragement"
      />
      <div className="space-y-4 px-4 py-4">
        <GroupsInteractive />
      </div>
    </div>
  );
}
