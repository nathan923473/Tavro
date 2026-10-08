"use client";

import { submitOffAppDeletionRequestAction } from "@/app/(app)/profile/delete-account-actions";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";

export function OffAppDeletionRequestForm() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          try {
            await submitOffAppDeletionRequestAction({ email, note });
            setMessage("Request received. We will email you when deletion is complete.");
            setEmail("");
            setNote("");
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Could not submit request.");
          }
        });
      }}
    >
      <label className="block text-sm">
        <span className="font-medium">Account email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-border px-3 py-3 text-sm outline-none ring-primary focus:ring-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Optional note</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-2xl border border-border px-3 py-3 text-sm outline-none ring-primary focus:ring-2"
          placeholder="Anything we should know to locate your account"
        />
      </label>
      {message ? (
        <p
          className={`text-sm ${message.startsWith("Request") ? "text-primary" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Submitting…" : "Submit deletion request"}
      </Button>
    </form>
  );
}
