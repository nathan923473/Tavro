import { JoinChallengeClient } from "@/app/join/[slug]/join-challenge-client";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengeByInviteSlug } from "@/lib/data/challenges";
import Link from "next/link";
import { notFound } from "next/navigation";

type JoinChallengePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: JoinChallengePageProps) {
  const { slug } = await params;
  const challenge = await fetchChallengeByInviteSlug(slug, null);
  return {
    title: challenge ? `Join ${challenge.title}` : "Challenge invite",
  };
}

export default async function JoinChallengePage({
  params,
}: JoinChallengePageProps) {
  const { slug } = await params;
  const { user, profile } = await getCurrentUserProfile();
  const challenge = await fetchChallengeByInviteSlug(slug, user?.id ?? null);

  if (!challenge) {
    notFound();
  }

  const viewerName =
    profile?.displayName?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "Member";

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-8 pt-[env(safe-area-inset-top)]">
      <div className="animate-fade-up space-y-4">
        <StandalonePageHeader
          pathname={`/join/${slug}`}
          title="Challenge invite"
        />
        <JoinChallengeClient
          challenge={challenge}
          viewerName={viewerName}
          loggedIn={Boolean(user)}
          viewerUserId={user?.id ?? null}
        />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
