import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchOwnerCommunity } from "@/lib/data/communities";
import { ImageIcon, Palette, Sparkles } from "lucide-react";
import Link from "next/link";

export async function CreatorMediaCard() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user || !profile) return null;
  if (profile.role !== "creator" && profile.role !== "admin") return null;

  const community = await fetchOwnerCommunity(user.id);
  const editHref = community
    ? `/creator/${community.slug}/edit`
    : "/studio/community";

  return (
    <Card className="border-primary/25 bg-secondary/20">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">Creator photos & branding</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Banner and profile image for your public page, plus cover and gallery
            photos on challenge invite pages.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <Link
          href={editHref}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          <Palette className="h-4 w-4" aria-hidden />
          Community banner & avatar
        </Link>
        <Link
          href="/studio/challenges"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
        >
          <ImageIcon className="h-4 w-4" aria-hidden />
          Challenge cover & gallery photos
        </Link>
        <Link
          href="/studio"
          className="text-center text-sm font-medium text-primary"
        >
          Open full Creator Studio
        </Link>
      </div>
    </Card>
  );
}
