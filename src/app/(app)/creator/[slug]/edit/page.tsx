import { EditCommunitySaveButton } from "@/components/creator/edit-community-save-button";
import { EditUploadButtons } from "@/components/creator/edit-upload-buttons";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { getCreatorCommunityBySlug } from "@/lib/mock-creators";
import { BackButton } from "@/components/layout/back-button";
import { Palette, Link2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

type EditCommunityPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EditCommunityPageProps) {
  const { slug } = await params;
  return { title: `Edit ${slug}` };
}

export default async function EditCommunityPage({
  params,
}: EditCommunityPageProps) {
  const { slug } = await params;
  const community = getCreatorCommunityBySlug(slug);

  if (!community) notFound();
  await requireApprovedCreator();

  return (
    <div className="animate-fade-up px-4 py-4">
      <div className="mb-4 space-y-3">
        <BackButton fallbackHref={`/creator/${slug}`} />
        <div>
          <h1 className="text-lg font-semibold">Edit community</h1>
          <p className="text-xs text-muted-foreground">Demo UI · Supabase + storage next</p>
        </div>
      </div>

      <Card className="mb-4 border-dashed">
        <p className="text-sm text-muted-foreground">
          Approved creators only (RLS in production). Image uploads will use
          Supabase Storage with size and type validation.
        </p>
      </Card>

      <form className="space-y-4">
        <Field label="Community URL slug">
          <input
            readOnly
            defaultValue={community.slug}
            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            streakly.app/creator/{community.slug}
          </p>
        </Field>
        <Field label="Community name">
          <input
            defaultValue={community.communityName}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Bio">
          <textarea
            defaultValue={community.bio}
            rows={4}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Primary brand colour">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              type="color"
              defaultValue={community.brandColor}
              className="h-10 w-14 cursor-pointer rounded-lg border border-border"
            />
            <span className="text-sm tabular-nums">{community.brandColor}</span>
          </div>
        </Field>
        <Field label="Profile picture & banner">
          <EditUploadButtons />
        </Field>
        <Field label="Shop or website link">
          <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              defaultValue={community.shopUrl ?? ""}
              placeholder="https://"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </Field>
        <Field label="Affiliate disclosure">
          <textarea
            defaultValue={community.affiliateDisclosure ?? ""}
            rows={3}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </Field>
        <EditCommunitySaveButton />
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
