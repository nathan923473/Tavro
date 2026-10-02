import { ChallengeCard } from "@/components/challenges/challenge-card";
import { Card } from "@/components/ui/card";
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
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-8">
      <div className="animate-fade-up space-y-4">
        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            You were invited to a <strong className="text-foreground">free</strong>{" "}
            challenge. Sign-up is quick — no payment, no public weigh-ins.
          </p>
        </Card>
        <ChallengeCard challenge={{ ...challenge, joined: false }} />
        <Link
          href="/onboarding"
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Continue to sign up
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/" className="font-medium text-primary">
            Go to home
          </Link>
        </p>
      </div>
    </div>
  );
}
