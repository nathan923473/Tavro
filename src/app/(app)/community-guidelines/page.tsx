import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

export const metadata = { title: "Community guidelines" };

export default function CommunityGuidelinesPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Community guidelines"
        subtitle="Keep Tavro safe and supportive for everyone"
      />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <h2 className="font-semibold">What belongs here</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Encouragement, progress updates, and fitness or wellness content appropriate for a general audience.</li>
            <li>Profile and community images that you would be comfortable showing in a public gym or community board.</li>
            <li>Honest challenge and group chat — no bullying or targeted harassment.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold">Not allowed</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Nudity, pornography, or sexually explicit images.</li>
            <li>Graphic violence, gore, or content that glorifies self-harm.</li>
            <li>Hate speech, slurs, threats, or harassment of members or creators.</li>
            <li>Spam, scams, impersonation, or misleading affiliate claims.</li>
            <li>Illegal content or content that violates others&apos; privacy.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold">Reporting</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use <strong className="text-foreground">Report</strong> on profile photos, creator pages,
            challenge images, and group or challenge messages. Each person can submit one report per
            item. Our team reviews reports manually — we do not use automated takedowns in this version
            of Tavro.
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold">Upload reminders</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When you upload a profile photo, creator banner, or challenge image, you confirm it follows
            these guidelines. Creators are responsible for images on their public community and challenge
            pages.
          </p>
          <Link
            href="/profile"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            Back to profile
          </Link>
        </Card>
      </div>
    </div>
  );
}
