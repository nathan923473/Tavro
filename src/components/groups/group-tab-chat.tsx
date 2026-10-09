"use client";

import { postGroupMessageAction, toggleGroupMessageReactionAction } from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ACCOUNTABILITY_GROUP_SINGULAR } from "@/lib/copy/accountability-groups";
import type { GroupActivity } from "@/types";
import { ReportContentMenu } from "@/components/moderation/report-content-menu";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

export function GroupTabChat({
  feed,
  viewerUserId,
  pending,
  run,
}: {
  feed: GroupActivity[];
  viewerUserId?: string | null;
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const [chatDraft, setChatDraft] = useState("");
  const messages = feed.filter((f) => f.kind === "message");

  return (
    <Card>
      <h3 className="font-semibold capitalize">{ACCOUNTABILITY_GROUP_SINGULAR} chat</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Private to your group — encourage each other and celebrate consistency.
      </p>
      <ul className="mt-3 max-h-[min(420px,50vh)] space-y-2 overflow-y-auto text-sm">
        {messages.length === 0 ? (
          <li className="text-muted-foreground">No messages yet — say hi!</li>
        ) : (
          messages.map((item) => (
            <li key={item.id} className="rounded-xl border border-border/80 px-3 py-2">
              <div className="flex flex-wrap items-start gap-2">
                <span>
                  <span className="font-semibold">{item.author}</span> {item.message}
                </span>
                <ReportContentMenu
                  contentType="group_message"
                  contentId={item.id}
                  reportedUserId={item.authorId}
                  canReport={Boolean(viewerUserId && viewerUserId !== item.authorId)}
                  compact
                />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
                {item.messageId ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-[#3156E8]"
                    disabled={pending}
                    onClick={() => run(() => toggleGroupMessageReactionAction(item.messageId!))}
                  >
                    👍 {item.reactions > 0 ? item.reactions : "React"}
                  </button>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
      <textarea
        rows={2}
        value={chatDraft}
        onChange={(e) => setChatDraft(e.target.value)}
        className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm"
        placeholder="Encourage your group…"
      />
      <Button
        className="mt-2 bg-[#3156E8] hover:bg-[#2442C4]"
        fullWidth
        disabled={pending || !chatDraft.trim()}
        onClick={() =>
          run(async () => {
            await postGroupMessageAction(chatDraft);
            setChatDraft("");
          })
        }
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Send message
      </Button>
    </Card>
  );
}
