import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string; challengeSlug: string }>;
};

/** Friendly creator URL — same join experience as /join/{invite_slug}. */
export default async function CreatorChallengePublicPage({ params }: Props) {
  const { challengeSlug } = await params;
  redirect(`/join/${challengeSlug}`);
}
