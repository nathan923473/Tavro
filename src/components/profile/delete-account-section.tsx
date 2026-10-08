"use client";

import { deleteAccountAction } from "@/app/(app)/profile/delete-account-actions";
import {
  ACCOUNT_DELETION_SUMMARY,
  deletionConsequencesParagraphs,
} from "@/lib/account-deletion/policy";
import { APP_NAME } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { useState, useTransition } from "react";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resetDialog() {
    setOpen(false);
    setPassword("");
    setConfirmation("");
    setAcknowledged(false);
    setError(null);
  }

  function onConfirmDelete() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteAccountAction({ password, confirmation });
        if (result?.ok) {
          window.location.href = "/account-deleted";
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete account.");
      }
    });
  }

  return (
    <>
      <Card className="border-red-200/80 bg-surface">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
          Danger zone
        </p>
        <h2 className="mt-1 text-lg font-bold text-foreground">Delete account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your {APP_NAME} account and associated personal data.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
          fullWidth
          onClick={() => setOpen(true)}
        >
          Delete account
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          You can also{" "}
          <Link href="/delete-account" className="font-medium text-primary underline-offset-2 hover:underline">
            request deletion without the app
          </Link>
          .
        </p>
      </Card>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h2 id="delete-account-title" className="text-xl font-bold text-foreground">
              Delete your {APP_NAME} account?
            </h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              {deletionConsequencesParagraphs().map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="font-semibold text-foreground">Removed</p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {ACCOUNT_DELETION_SUMMARY.deleted.slice(0, 5).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  <li>…and other personal data listed in our privacy policy</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground">Archived or detached</p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {ACCOUNT_DELETION_SUMMARY.anonymisedOrDetached.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground">May be retained</p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {ACCOUNT_DELETION_SUMMARY.mayRetain.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <label className="mt-4 flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <span>I understand this is permanent and cannot be undone.</span>
            </label>

            <label className="mt-3 block text-sm">
              <span className="font-medium text-foreground">
                Type <strong>DELETE</strong> to confirm
              </span>
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                className="mt-1 w-full rounded-2xl border border-border px-3 py-3 text-sm outline-none ring-primary focus:ring-2"
                placeholder="DELETE"
              />
            </label>

            <label className="mt-3 block text-sm">
              <span className="font-medium text-foreground">Current password</span>
              <span className="block text-xs text-muted-foreground">
                Required for email/password accounts. Leave blank if you only sign in with a
                provider.
              </span>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1"
              />
            </label>

            {error ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <Button
                type="button"
                disabled={
                  pending || !acknowledged || confirmation.trim() !== "DELETE"
                }
                className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                fullWidth
                onClick={onConfirmDelete}
              >
                {pending ? "Deleting…" : "Permanently delete account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                fullWidth
                disabled={pending}
                onClick={resetDialog}
              >
                Cancel
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
                Privacy policy
              </Link>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
