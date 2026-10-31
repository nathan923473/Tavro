"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { saveCommunityAction } from "@/app/(app)/member/actions";
import { setCommunityMediaUrlsAction } from "@/app/(app)/studio/media-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentGuidelinesReminder } from "@/components/moderation/content-guidelines-reminder";
import { creatorCommunityBrandLabel } from "@/lib/creator-display-name";
import { uploadCommunityMediaFile } from "@/lib/storage/upload-client";
import { Camera, ExternalLink, Link2, Palette, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

function previewSlugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return base || "your-community";
}

function initialsFrom(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "T";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function CommunityPageEditor({
  mode,
  slug: initialSlug,
  ownerId,
  creatorDisplayName,
  communityName: initialName,
  bio: initialBio,
  brandColor: initialBrand,
  shopUrl: initialShop,
  affiliateDisclosure: initialDisclosure,
  avatarUrl: initialAvatar,
  bannerUrl: initialBanner,
}: {
  mode: "create" | "edit";
  slug: string;
  ownerId: string;
  creatorDisplayName: string;
  communityName: string;
  bio: string;
  brandColor: string;
  shopUrl: string;
  affiliateDisclosure: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [brandColor, setBrandColor] = useState(initialBrand);
  const [shopUrl, setShopUrl] = useState(initialShop);
  const [affiliateDisclosure, setAffiliateDisclosure] = useState(initialDisclosure);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [bannerUrl, setBannerUrl] = useState(initialBanner);
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const canUploadMedia = mode === "edit" && Boolean(initialSlug);
  const previewSlug = initialSlug || previewSlugFromName(communityName);
  const brandLine = useMemo(
    () => creatorCommunityBrandLabel(communityName, creatorDisplayName),
    [communityName, creatorDisplayName],
  );
  const bannerGradient = `linear-gradient(135deg, ${brandColor} 0%, #2442c4 100%)`;

  function uploadMedia(kind: "avatar" | "banner", file: File) {
    if (!canUploadMedia) {
      setMessage("Save your community page first, then you can add photos.");
      return;
    }
    startTransition(async () => {
      try {
        const url = await uploadCommunityMediaFile(ownerId, kind, file);
        await setCommunityMediaUrlsAction(
          kind === "avatar" ? { avatarUrl: url } : { bannerUrl: url },
        );
        if (kind === "avatar") setAvatarUrl(url);
        else setBannerUrl(url);
        setMessage(`${kind === "avatar" ? "Profile" : "Banner"} photo updated.`);
        router.refresh();
      } catch (e) {
        setMessage(userFacingErrorMessage(e, "Upload failed."));
      }
    });
  }

  function savePage() {
    if (!communityName.trim()) {
      setMessage("Add a community name first.");
      return;
    }
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("slug", initialSlug);
        formData.set("community_name", communityName.trim());
        formData.set("bio", bio);
        formData.set("brand_color", brandColor);
        formData.set("shop_url", shopUrl.trim());
        formData.set("affiliate_disclosure", affiliateDisclosure);
        const result = await saveCommunityAction(formData);
        setMessage("Saved — this is what members will see.");
        router.refresh();
        if (mode === "create") {
          router.push(`/creator/${result.slug}/edit`);
          return;
        }
        if (result.slug !== initialSlug) {
          router.push(`/creator/${result.slug}/edit`);
        }
      } catch (e) {
        setMessage(userFacingErrorMessage(e, "Save failed."));
      }
    });
  }

  return (
    <div className="pb-28">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {mode === "create" ? "Build your public page" : "Editing live preview"}
        </p>
        {mode === "edit" && initialSlug ? (
          <Link
            href={`/creator/${initialSlug}`}
            className="text-xs font-semibold text-primary"
          >
            View public page
          </Link>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div
          className="group relative h-40 w-full"
          style={bannerUrl ? undefined : { background: bannerGradient }}
        >
          {bannerUrl ? (
            <Image src={bannerUrl} alt="" fill className="object-cover" unoptimized />
          ) : null}
          <div className="absolute inset-0 bg-black/10" />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              canUploadMedia ? bannerInput.current?.click() : savePage()
            }
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-semibold shadow-sm"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden />
            {canUploadMedia ? "Change banner" : "Save to add banner"}
          </button>
        </div>

        <div className="relative px-4 pb-6">
          <div className="relative -mt-12 inline-block">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-md">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {initialsFrom(communityName || creatorDisplayName)}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                canUploadMedia ? avatarInput.current?.click() : savePage()
              }
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface shadow-sm"
              aria-label="Upload profile photo"
            >
              <Camera className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-3 space-y-1">
            <label className="sr-only" htmlFor="community_name">
              Community name
            </label>
            <input
              id="community_name"
              name="community_name"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              required
              placeholder="Your community name"
              className="w-full border-0 bg-transparent p-0 text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60 focus:ring-0"
            />
            {brandLine ? (
              <p className="text-sm text-muted-foreground">{brandLine}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{creatorDisplayName}</p>
            )}
            <p className="text-xs text-muted-foreground">
              tavro.app/creator/
              <span className="font-medium text-foreground">{previewSlug}</span>
              {mode === "create" ? " · link finalises when you save" : null}
            </p>
          </div>

          <label className="sr-only" htmlFor="community_bio">
            Bio
          </label>
          <textarea
            id="community_bio"
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell people what your community is about — who it's for and how you help."
            className="mt-3 w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="muted">0 members</Badge>
            <Badge tone="muted">0 challenges hosted</Badge>
            <Badge tone="success">Free community</Badge>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Brand colour
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Palette className="h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                type="color"
                name="brand_color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface"
                aria-label="Primary brand colour"
              />
              <span className="text-xs text-muted-foreground">
                Used on badges and accents across your page
              </span>
            </div>
          </div>

          <section className="mt-6" aria-labelledby="editor-shop-heading">
            <h2 id="editor-shop-heading" className="mb-2 text-base font-semibold">
              Creator&apos;s shop
            </h2>
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="flex gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium">Optional shop or website</p>
                  <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <input
                      name="shop_url"
                      value={shopUrl}
                      onChange={(e) => setShopUrl(e.target.value)}
                      placeholder="https://"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  {shopUrl.trim() ? (
                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Open shop
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Free challenges never require a purchase.
                    </p>
                  )}
                  <textarea
                    name="affiliate_disclosure"
                    value={affiliateDisclosure}
                    onChange={(e) => setAffiliateDisclosure(e.target.value)}
                    rows={2}
                    placeholder="Affiliate disclosure (optional)"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 rounded-xl border border-border/80 bg-secondary/20 px-3 py-4 text-center">
            <p className="text-sm font-medium">Challenges</p>
            <p className="mt-1 text-xs text-muted-foreground">
              After you save this page, publish free challenges from Creator Studio — they&apos;ll
              show up here for followers.
            </p>
            {mode === "edit" ? (
              <Link
                href="/studio/challenges/new"
                className="mt-3 inline-block text-sm font-semibold text-primary"
              >
                Create a challenge →
              </Link>
            ) : null}
          </div>

          <ContentGuidelinesReminder className="mt-4" />
        </div>
      </div>

      <input
        ref={avatarInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) uploadMedia("avatar", file);
        }}
      />
      <input
        ref={bannerInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) uploadMedia("banner", file);
        }}
      />

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <Button type="button" fullWidth disabled={pending || !communityName.trim()} onClick={savePage}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Save community page"
              : "Save changes"}
        </Button>
        {message ? (
          <p className="mt-2 text-center text-xs text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
