"use client";

import {
  deleteCreatorLinkAction,
  upsertCreatorLinkAction,
} from "@/app/(app)/studio/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CreatorLinkRow } from "@/types/creator-studio";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const LINK_TYPES: { value: string; label: string; labelHint: string; urlExample: string }[] = [
  {
    value: "website",
    label: "Website",
    labelHint: "Visit my website",
    urlExample: "https://yourname.com",
  },
  {
    value: "shop",
    label: "Online shop",
    labelHint: "Shop my store",
    urlExample: "https://shop.example.com",
  },
  {
    value: "coaching",
    label: "Coaching",
    labelHint: "Book a coaching call",
    urlExample: "https://calendly.com/you",
  },
  {
    value: "program",
    label: "Fitness program",
    labelHint: "My training program",
    urlExample: "https://…",
  },
  {
    value: "merchandise",
    label: "Merchandise",
    labelHint: "Shop merch",
    urlExample: "https://…",
  },
  {
    value: "instagram",
    label: "Instagram",
    labelHint: "Follow on Instagram",
    urlExample: "https://instagram.com/yourhandle",
  },
  {
    value: "tiktok",
    label: "TikTok",
    labelHint: "Follow on TikTok",
    urlExample: "https://tiktok.com/@you",
  },
  {
    value: "youtube",
    label: "YouTube",
    labelHint: "Subscribe on YouTube",
    urlExample: "https://youtube.com/@you",
  },
  {
    value: "other",
    label: "Other",
    labelHint: "Learn more",
    urlExample: "https://…",
  },
];

export function StudioShopPanel({
  communityId,
  links,
}: {
  communityId: string;
  links: CreatorLinkRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [linkType, setLinkType] = useState("shop");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const typeMeta = useMemo(
    () => LINK_TYPES.find((t) => t.value === linkType) ?? LINK_TYPES[0],
    [linkType],
  );

  const previewLabel = label.trim() || typeMeta.labelHint;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="font-semibold">Add link</h2>
        <p className="text-xs text-muted-foreground">
          External links only — no checkout or payments in the app.
        </p>

        <label className="block text-sm">
          <span className="font-medium">Link type</span>
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            Helps you organize links; visitors mostly see the button text below.
          </span>
          <select
            className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
          >
            {LINK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Button text (label)</span>
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            Short phrase shown on your public page — what people tap. Not the web
            address.
          </span>
          <input
            className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder={`e.g. ${typeMeta.labelHint}`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-describedby="shop-label-hint"
          />
          <p id="shop-label-hint" className="mt-1.5 text-xs text-muted-foreground">
            Example: &ldquo;Shop my merch&rdquo;, &ldquo;Book a call&rdquo;, &ldquo;My
            Etsy shop&rdquo;
          </p>
        </label>

        <label className="block text-sm">
          <span className="font-medium">URL</span>
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            Full link opened when someone taps the button.
          </span>
          <input
            className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder={typeMeta.urlExample}
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Preview on your page
          </p>
          <p className="mt-1 text-sm font-semibold text-primary">{previewLabel} →</p>
        </div>

        <Button
          type="button"
          fullWidth
          disabled={pending || !label.trim() || !url.trim()}
          onClick={() =>
            startTransition(async () => {
              await upsertCreatorLinkAction({
                communityId,
                linkType,
                label,
                url,
                isPublic: true,
                sortOrder: links.length,
              });
              setLabel("");
              setUrl("");
              router.refresh();
            })
          }
        >
          Add link
        </Button>
      </Card>

      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.id}>
            <Card padding="sm" className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{link.label}</p>
                <p className="truncate text-xs text-muted-foreground">{link.url}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                aria-label="Remove link"
                onClick={() =>
                  startTransition(async () => {
                    await deleteCreatorLinkAction(communityId, link.id);
                    router.refresh();
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
