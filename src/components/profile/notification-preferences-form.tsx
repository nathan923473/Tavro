"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { saveNotificationPreferencesAction } from "@/app/(app)/profile/notification-actions";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";

export function NotificationPreferencesForm({
  initial,
}: {
  initial: {
    challengeReminders: boolean;
    creatorAnnouncements: boolean;
    newChallengesFromFollowed: boolean;
  };
}) {
  const [prefs, setPrefs] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            await saveNotificationPreferencesAction(prefs);
            setMessage("Saved.");
          } catch (err) {
            setMessage(userFacingErrorMessage(err, "Save failed."));
          }
        });
      }}
    >
      {(
        [
          ["challengeReminders", "Challenge reminders"] as const,
          ["creatorAnnouncements", "Creator announcements"] as const,
          ["newChallengesFromFollowed", "New challenges from followed creators"] as const,
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex items-center justify-between gap-3 text-sm">
          <span>{label}</span>
          <input
            type="checkbox"
            checked={prefs[key]}
            onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
          />
        </label>
      ))}
      <Button type="submit" variant="outline" fullWidth disabled={pending}>
        Save preferences
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </form>
  );
}
