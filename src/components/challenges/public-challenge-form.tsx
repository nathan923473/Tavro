"use client";

import { createPublicChallenge } from "@/app/(app)/challenges/create/actions";
import { publishChallengeAction } from "@/app/(app)/studio/actions";
import { ChallengeCoverField } from "@/components/challenges/challenge-cover-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import {
  CHALLENGE_COVER_REQUIRED_MESSAGE,
  challengeHasCover,
} from "@/lib/challenge-lifecycle/cover-required";
import Link from "next/link";
import { useState, useTransition } from "react";

export function PublicChallengeForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<{
    challengeId: string;
    invitePath: string;
    title: string;
  } | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [publishedPath, setPublishedPath] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await createPublicChallenge(formData);
    if (result.ok) {
      setDraft({
        challengeId: result.challengeId,
        invitePath: result.invitePath,
        title: String(formData.get("title") ?? "Challenge"),
      });
      setCoverUrl(null);
    } else {
      setError(result.error);
    }
  }

  function publishDraft() {
    if (!draft) return;
    startTransition(async () => {
      try {
        setError(null);
        const paths = await publishChallengeAction(draft.challengeId);
        setPublishedPath(paths.creatorPath);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Publish failed.");
      }
    });
  }

  if (publishedPath && draft) {
    return (
      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold">Public challenge published</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your invite link. You can add gallery photos anytime in Studio.
          </p>
          <div className="mt-3">
            <CopyLinkButton url={publishedPath} label="Copy challenge link" fullWidth />
          </div>
        </Card>
        <Link
          href="/studio/challenges"
          className="block text-center text-sm font-medium text-primary"
        >
          All challenges in Studio →
        </Link>
      </div>
    );
  }

  if (draft) {
    return (
      <div className="space-y-4">
        <Card className="space-y-3">
          <h2 className="font-semibold">Cover image required</h2>
          <p className="text-sm text-muted-foreground">
            Your challenge is saved as a draft. Upload a cover, then publish.
          </p>
          <ChallengeCoverField
            challengeId={draft.challengeId}
            coverUrl={coverUrl}
            title={draft.title}
            required
            onCoverUrlChange={setCoverUrl}
          />
          <Button
            type="button"
            fullWidth
            disabled={pending || !challengeHasCover(coverUrl)}
            onClick={publishDraft}
          >
            Publish free public challenge
          </Button>
          {!challengeHasCover(coverUrl) ? (
            <p className="text-sm text-amber-800">{CHALLENGE_COVER_REQUIRED_MESSAGE}</p>
          ) : null}
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <p className="mb-3 text-sm text-muted-foreground">
        You will upload a <strong className="text-foreground">required cover image</strong> on
        the next step before the challenge goes live.
      </p>
      <form action={handleSubmit} className="space-y-3">
        <Field label="Challenge name" name="title" required />
        <Field label="Description" name="description" textarea />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Start date" name="start_date" type="date" required />
          <Field label="End date" name="end_date" type="date" required />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" fullWidth>
          Continue to cover image
        </Button>
      </form>
    </Card>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  textarea,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  textarea?: boolean;
}) {
  const className =
    "w-full rounded-xl border border-border px-3 py-2.5 text-sm";
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {textarea ? (
        <textarea name={name} rows={3} className={className} />
      ) : (
        <input name={name} type={type} required={required} className={className} />
      )}
    </div>
  );
}
