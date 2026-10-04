"use client";

import { saveCommunityAction } from "@/app/(app)/member/actions";
import { CommunityMediaUpload } from "@/components/creator/community-media-upload";
import { Button } from "@/components/ui/button";
import { Palette, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function EditCommunityForm({
  slug,
  ownerId,
  communityName,
  bio,
  brandColor,
  shopUrl,
  affiliateDisclosure,
  avatarUrl,
  bannerUrl,
}: {
  slug: string;
  ownerId: string;
  communityName: string;
  bio: string;
  brandColor: string;
  shopUrl: string;
  affiliateDisclosure: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        startTransition(async () => {
          try {
            const result = await saveCommunityAction(formData);
            setMessage("Saved to Supabase.");
            router.refresh();
            if (result.slug !== slug) {
              router.push(`/creator/${result.slug}/edit`);
            }
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Save failed.");
          }
        });
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <Field label="Community URL slug">
        <input
          readOnly
          name="slug_display"
          defaultValue={slug}
          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Community name">
        <input
          name="community_name"
          defaultValue={communityName}
          required
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Bio">
        <textarea
          name="bio"
          defaultValue={bio}
          rows={4}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Primary brand colour">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            type="color"
            name="brand_color"
            defaultValue={brandColor}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border"
          />
        </div>
      </Field>
      <Field label="Profile picture & banner">
        <CommunityMediaUpload
          ownerId={ownerId}
          avatarUrl={avatarUrl}
          bannerUrl={bannerUrl}
        />
      </Field>
      <Field label="Shop or website link">
        <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
          <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            name="shop_url"
            defaultValue={shopUrl}
            placeholder="https://"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </Field>
      <Field label="Affiliate disclosure">
        <textarea
          name="affiliate_disclosure"
          defaultValue={affiliateDisclosure}
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
        />
      </Field>
      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
