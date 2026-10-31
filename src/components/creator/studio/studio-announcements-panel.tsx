"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { createAnnouncementAction } from "@/app/(app)/studio/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CreatorAnnouncement, CreatorStudioChallenge } from "@/types/creator-studio";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StudioAnnouncementsPanel({
  communityId,
  challenges,
  announcements,
  defaultChallengeId,
}: {
  communityId: string;
  challenges: CreatorStudioChallenge[];
  announcements: CreatorAnnouncement[];
  defaultChallengeId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [challengeId, setChallengeId] = useState(defaultChallengeId ?? "");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="font-semibold">New announcement</h2>
        <input
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          rows={4}
          placeholder="Message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <label className="block text-sm">
          <span className="font-medium">Audience</span>
          <select
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
          >
            <option value="">Whole community (followers)</option>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                Challenge: {c.title}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          fullWidth
          disabled={pending || !title.trim() || !body.trim()}
          onClick={() =>
            startTransition(async () => {
              try {
                await createAnnouncementAction({
                  communityId,
                  challengeId: challengeId || null,
                  title,
                  body,
                });
                setTitle("");
                setBody("");
                setMessage("Published.");
                router.refresh();
              } catch (e) {
                setMessage(userFacingErrorMessage(e, "Failed."));
              }
            })
          }
        >
          Publish announcement
        </Button>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </Card>

      <section>
        <h2 className="mb-2 text-base font-semibold">Previous announcements</h2>
        {announcements.length === 0 ? (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">None yet.</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li key={a.id}>
                <Card padding="sm">
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {a.challengeTitle ? `Challenge: ${a.challengeTitle}` : "Community-wide"} ·{" "}
                    {new Date(a.publishAt).toLocaleString()}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
