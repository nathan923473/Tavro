"use client";

import { submitChallengeFeedbackAction } from "@/lib/challenge-report/challenge-feedback-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useTransition } from "react";

type Props = {
  challengeId: string;
  initial?: {
    rating: number;
    what_helped: string | null;
    what_improve: string | null;
    share_written_feedback: boolean;
  } | null;
};

export function ChallengeFeedbackForm({ challengeId, initial }: Props) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [whatHelped, setWhatHelped] = useState(initial?.what_helped ?? "");
  const [whatImprove, setWhatImprove] = useState(initial?.what_improve ?? "");
  const [shareWritten, setShareWritten] = useState(initial?.share_written_feedback ?? false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="space-y-3 border-dashed border-primary/25 bg-secondary/10 text-left">
      <div>
        <p className="text-sm font-semibold">Optional feedback</p>
        <p className="text-xs text-muted-foreground">
          Help your creator improve future challenges. You can update your answers anytime.
        </p>
      </div>
      <fieldset>
        <legend className="text-xs font-medium text-muted-foreground">
          How helpful was this challenge?
        </legend>
        <div className="mt-1 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold ${
                rating === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface"
              }`}
              onClick={() => setRating(n)}
              aria-pressed={rating === n}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block text-xs font-medium text-muted-foreground">
        What helped you stay consistent? (optional)
        <textarea
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          rows={2}
          value={whatHelped}
          onChange={(e) => setWhatHelped(e.target.value)}
          maxLength={2000}
        />
      </label>
      <label className="block text-xs font-medium text-muted-foreground">
        What could be improved? (optional)
        <textarea
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          rows={2}
          value={whatImprove}
          onChange={(e) => setWhatImprove(e.target.value)}
          maxLength={2000}
        />
      </label>
      {(whatHelped.trim() || whatImprove.trim()) ? (
        <label className="flex items-start gap-2 text-xs">
          <input
            type="checkbox"
            checked={shareWritten}
            onChange={(e) => setShareWritten(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Share my written comments with the creator in their challenge report (not anonymous).
          </span>
        </label>
      ) : null}
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      <Button
        type="button"
        fullWidth
        disabled={pending || rating < 1}
        onClick={() => {
          startTransition(async () => {
            const res = await submitChallengeFeedbackAction({
              challengeId,
              rating,
              whatHelped,
              whatImprove,
              shareWrittenFeedback: shareWritten,
            });
            setMessage(res.ok ? "Thanks — feedback saved." : res.message);
          });
        }}
      >
        {pending ? "Saving…" : initial ? "Update feedback" : "Submit feedback"}
      </Button>
    </Card>
  );
}
