"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import { MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";

type ChallengeGroupChatProps = {
  challengeId: string;
  challengeTitle: string;
  viewerName: string;
  viewerRole: "creator" | "member";
  /** Members must join the challenge before posting. Creators can always post. */
  canPost: boolean;
  compact?: boolean;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ChallengeGroupChat({
  challengeId,
  challengeTitle,
  viewerName,
  viewerRole,
  canPost,
  compact = false,
}: ChallengeGroupChatProps) {
  const { state, postChallengeMessage } = useDemoStore();
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const messages = state.challengeMessages[challengeId] ?? [];

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    if (!canPost) {
      setStatus("Join this challenge to post in the group.");
      return;
    }
    postChallengeMessage(challengeId, {
      authorName: viewerName,
      role: viewerRole,
      text,
    });
    setDraft("");
    setStatus("Message sent.");
  }

  return (
    <Card className={compact ? "mt-4 border-dashed" : undefined}>
      <div className="flex items-start gap-2">
        <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">
            {compact ? "Challenge group" : `${challengeTitle} — group chat`}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo chat saved on this device. Creators message participants here —
            not private accountability groups.
          </p>
        </div>
      </div>

      <ul
        className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No messages yet. {viewerRole === "creator" ? "Post the first update." : "Check back soon."}
          </li>
        ) : (
          messages.map((msg) => (
            <li key={msg.id} className="text-sm leading-relaxed">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{msg.authorName}</span>
                {msg.role === "creator" ? (
                  <Badge tone="success" className="text-[10px]">
                    Creator
                  </Badge>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 text-muted-foreground">{msg.text}</p>
            </li>
          ))
        )}
      </ul>

      <div className="mt-3 space-y-2">
        <label className="sr-only" htmlFor={`challenge-chat-${challengeId}`}>
          Message {challengeTitle} group
        </label>
        <textarea
          id={`challenge-chat-${challengeId}`}
          rows={2}
          value={draft}
          disabled={!canPost}
          placeholder={
            canPost
              ? viewerRole === "creator"
                ? "Encourage your challenge group…"
                : "Reply to your challenge group…"
              : "Join the challenge to message the group"
          }
          onChange={(e) => setDraft(e.target.value)}
          className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2 disabled:opacity-60"
        />
        <Button
          type="button"
          fullWidth
          disabled={!canPost || !draft.trim()}
          onClick={handleSend}
        >
          Send to group
        </Button>
        {status ? (
          <p className="text-xs text-muted-foreground" role="status">
            {status}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
