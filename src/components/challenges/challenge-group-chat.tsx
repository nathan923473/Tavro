"use client";

import { postChallengeMessageAction } from "@/app/(app)/member/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChallengeChatMessage } from "@/lib/challenge-chat";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ChallengeGroupChatProps = {
  challengeId: string;
  challengeTitle: string;
  viewerName: string;
  viewerRole: "creator" | "member";
  canPost: boolean;
  messages: ChallengeChatMessage[];
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
  viewerRole,
  canPost,
  messages,
  compact = false,
}: ChallengeGroupChatProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSend() {
    const text = draft.trim();
    if (!text || !canPost) return;
    startTransition(async () => {
      try {
        await postChallengeMessageAction({
          challengeId,
          body: text,
          role: viewerRole,
        });
        setDraft("");
        setStatus("Message sent.");
        router.refresh();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Could not send message.");
      }
    });
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
            Messages sync to your Supabase project for all participants.
          </p>
        </div>
      </div>

      <ul
        className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No messages yet. Be the first to encourage the group.
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
          disabled={!canPost || pending}
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
          disabled={!canPost || pending || !draft.trim()}
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
