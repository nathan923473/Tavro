"use client";

import { updateDisplayNameAction } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DisplayNameCard({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        await updateDisplayNameAction(name);
        setMessage("Saved.");
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  return (
    <Card>
      <h2 className="font-semibold">Display name</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Shown on Profile, challenges, and discover. This is not your login email.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <label className="block text-sm">
          <span className="sr-only">Display name</span>
          <input
            type="text"
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
            required
          />
        </label>
        {message ? (
          <p className={`text-sm ${message === "Saved." ? "text-emerald-700" : "text-red-600"}`}>
            {message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? "Saving…" : "Save name"}
        </Button>
      </form>
    </Card>
  );
}
