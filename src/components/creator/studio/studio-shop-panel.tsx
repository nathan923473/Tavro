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
import { useState, useTransition } from "react";

const LINK_TYPES = [
  "website",
  "shop",
  "coaching",
  "program",
  "merchandise",
  "instagram",
  "tiktok",
  "youtube",
  "other",
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
  const [linkType, setLinkType] = useState("website");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="font-semibold">Add link</h2>
        <p className="text-xs text-muted-foreground">
          External links only — no checkout or payments in the app.
        </p>
        <select
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={linkType}
          onChange={(e) => setLinkType(e.target.value)}
        >
          {LINK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
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
