"use client";

import { createPublicChallenge } from "@/app/(app)/challenges/create/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import Link from "next/link";
import { useState } from "react";

export function PublicChallengeForm() {
  const [error, setError] = useState<string | null>(null);
  const [invitePath, setInvitePath] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await createPublicChallenge(formData);
    if (result.ok) {
      setInvitePath(result.invitePath);
      setChallengeId(result.challengeId);
    } else {
      setError(result.error);
    }
  }

  if (invitePath) {
    return (
      <Card>
        <h2 className="font-semibold">Public challenge published</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Listed in discovery when wired to live queries. Share your invite link:
        </p>
        <div className="mt-3 space-y-2">
          <CopyLinkButton url={invitePath} label="Copy challenge link" fullWidth />
          {challengeId ? (
            <Link
              href={`/studio/challenges/${challengeId}/photos`}
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-surface text-sm font-semibold"
            >
              Add cover & gallery photos
            </Link>
          ) : null}
        </div>
      </Card>
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
