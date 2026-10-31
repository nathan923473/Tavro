"use client";

import {
  createCreatorInvitationAction,
  revokeCreatorInvitationAction,
} from "@/app/(app)/admin/creator-invitations/actions";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CreatorInvitationRow } from "@/lib/creator/invitations";
import { userFacingErrorMessage } from "@/lib/errors/user-message";
import { useState } from "react";

function inviteState(invite: CreatorInvitationRow, now = Date.now()): string {
  if (invite.accepted_at) return "Accepted";
  if (invite.revoked_at) return "Revoked";
  if (new Date(invite.expires_at).getTime() <= now) return "Expired";
  return "Open";
}

export function CreatorInvitationManager({
  invitations,
}: {
  invitations: CreatorInvitationRow[];
}) {
  const [link, setLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onCreate(formData: FormData) {
    setPending(true);
    setMessage(null);
    setLink(null);
    const result = await createCreatorInvitationAction(formData);
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setLink(result.link);
  }

  async function onRevoke(id: string) {
    setMessage(null);
    try {
      await revokeCreatorInvitationAction(id);
      window.location.reload();
    } catch (error) {
      setMessage(userFacingErrorMessage(error, "Could not revoke that invitation."));
    }
  }

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const latest = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-semibold">Invite a creator</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One link, one email, one use. They sign up or log in with that email and get
          Creator Studio without the public application or bio code. The raw link is
          shown once.
        </p>
        <form action={onCreate} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="invite-email">
              Creator email
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="coach@example.com"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="invite-expiry">
              Expiry date
            </label>
            <input
              id="invite-expiry"
              name="expires_on"
              type="date"
              required
              min={tomorrow}
              max={latest}
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The link works through the end of this date, Melbourne time. 90 days at most.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="invite-note">
              Note for you (optional)
            </label>
            <input
              id="invite-note"
              name="note"
              maxLength={280}
              placeholder="Met at the workshop"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </div>
          <Button type="submit" fullWidth disabled={pending}>
            {pending ? "Creating…" : "Create invite link"}
          </Button>
        </form>
        {link ? (
          <div className="mt-4 space-y-2 rounded-xl bg-muted p-3">
            <p className="text-sm font-medium">Copy this link now. It is not stored.</p>
            <p className="break-all font-mono text-xs">{link}</p>
            <CopyLinkButton url={link} label="Copy invite link" fullWidth />
          </div>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {message}
          </p>
        ) : null}
      </Card>

      {invitations.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">No creator invitations yet.</p>
        </Card>
      ) : (
        invitations.map((invite) => {
          const state = inviteState(invite);
          return (
            <Card key={invite.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{invite.intended_email}</h2>
                  <p className="text-xs text-muted-foreground">
                    Invited by admin {invite.created_by}
                  </p>
                </div>
                <Badge tone={state === "Accepted" ? "success" : state === "Open" ? "muted" : "warning"}>
                  {state}
                </Badge>
              </div>
              <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div>Expires {new Date(invite.expires_at).toLocaleString()}</div>
                {invite.note ? <div>Note: {invite.note}</div> : null}
                {invite.accepted_by ? (
                  <div>
                    Accepted by {invite.accepted_by}
                    {invite.accepted_at
                      ? ` on ${new Date(invite.accepted_at).toLocaleString()}`
                      : ""}
                    . The inviting admin is stored as the approver.
                  </div>
                ) : null}
              </dl>
              {state === "Open" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => onRevoke(invite.id)}
                >
                  Revoke
                </Button>
              ) : null}
            </Card>
          );
        })
      )}
    </div>
  );
}
