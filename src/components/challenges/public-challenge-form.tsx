"use client";

import { createPublicChallenge } from "@/app/(app)/challenges/create/actions";
import { ChallengePhotosEditor } from "@/components/creator/challenge-photos-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import Link from "next/link";
import { useState } from "react";

export function PublicChallengeForm() {
  const [error, setError] = useState<string | null>(null);
  const [invitePath, setInvitePath] = useState<string | null>(null);
  const [published, setPublished] = useState<{
    challengeId: string;
    creatorId: string;
    title: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await createPublicChallenge(formData);
    if (result.ok) {
      setInvitePath(result.invitePath);
      setPublished({
        challengeId: result.challengeId,
        creatorId: result.creatorId,
        title: String(formData.get("title") ?? "Challenge"),
      });
    } else {
      setError(result.error);
    }
  }

  if (invitePath && published) {
    return (
      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold">Public challenge published</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your invite link, then add photos below (also in Studio → Challenge
            photos).
          </p>
          <div className="mt-3">
            <CopyLinkButton url={invitePath} label="Copy challenge link" fullWidth />
          </div>
        </Card>
        <Card>
          <ChallengePhotosEditor
            challengeId={published.challengeId}
            creatorId={published.creatorId}
            title={published.title}
            coverUrl={null}
            photos={[]}
          />
        </Card>
        <Link
          href="/studio/challenges"
          className="block text-center text-sm font-medium text-primary"
        >
          All challenge photos →
        </Link>
      </div>
    );
  }

  return (
    <Card>
      <p className="mb-3 text-sm text-muted-foreground">
        After you publish, use{" "}
        <strong className="text-foreground">Add cover & gallery photos</strong> on
        the next screen (or Studio → Challenge photos).
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
          Publish free public challenge
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
