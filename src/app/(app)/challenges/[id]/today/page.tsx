import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Legacy route — participant hub defaults to Today tab. */
export default async function ChallengeTodayRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/challenges/${id}?tab=today`);
}
