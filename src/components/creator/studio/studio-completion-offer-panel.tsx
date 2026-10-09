"use client";

import { saveCompletionOfferAction } from "@/app/(app)/studio/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CreatorLinkRow } from "@/types/creator-studio";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type CompletionOfferSettings = {
  enabled: boolean;
  linkId: string | null;
  headline: string;
  message: string;
};

export function StudioCompletionOfferPanel({
  communityId,
  links,
  initial,
}: {
  communityId: string;
  links: CreatorLinkRow[];
  initial: CompletionOfferSettings;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const publicLinks = links.filter((l) => l.isPublic);

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-semibold">Challenge completion offer</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional. Shown after someone finishes your challenge — clearly labelled as a
          creator offer. No purchase required to complete a free challenge.
        </p>
      </div>

      <form
        className="space-y-3"
        action={(formData) => {
          startTransition(async () => {
            try {
              await saveCompletionOfferAction(formData);
              setMessage("Saved.");
              router.refresh();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Save failed.");
            }
          });
        }}
      >
        <input type="hidden" name="communityId" value={communityId} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={initial.enabled}
            className="h-4 w-4 rounded border-border"
          />
          Show offer when a participant completes a challenge
        </label>

        <label className="block text-sm">
          <span className="font-medium">Headline</span>
          <input
            name="headline"
            defaultValue={initial.headline}
            placeholder="Want more personalised support?"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Message</span>
          <textarea
            name="offerMessage"
            defaultValue={initial.message}
            rows={3}
            placeholder="Explore my coaching program for your next goal."
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Link to feature</span>
          <select
            name="linkId"
            defaultValue={initial.linkId ?? ""}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          >
            <option value="">Select a public link…</option>
            {publicLinks.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label} ({l.linkType})
              </option>
            ))}
          </select>
          {publicLinks.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Add at least one public link above, then choose it here.
            </p>
          ) : null}
        </label>

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Saving…" : "Save completion offer"}
        </Button>
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
