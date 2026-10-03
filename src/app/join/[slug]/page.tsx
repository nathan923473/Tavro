import { JoinChallengeClient } from "@/app/join/[slug]/join-challenge-client";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { getChallengeBySlug } from "@/lib/mock-data";
import Link from "next/link";
import { notFound } from "next/navigation";

type JoinChallengePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: JoinChallengePageProps) {
  const { slug } = await params;
  const challenge = getChallengeBySlug(slug);
  return {
    title: challenge ? `Join ${challenge.title}` : "Challenge invite",
  };
}

export default async function JoinChallengePage({ params }: JoinChallengePageProps) {
  const { slug } = await params;
  const challenge = getChallengeBySlug(slug);

  if (!challenge) {
    notFound();
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-8 pt-[env(safe-area-inset-top)]">
      <div className="animate-fade-up space-y-4">
        <StandalonePageHeader
          pathname={`/join/${slug}`}
          title="Challenge invite"
        />
        <JoinChallengeClient challenge={challenge} />
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
