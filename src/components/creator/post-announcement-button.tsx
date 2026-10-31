"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { updateCommunityAnnouncementAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PostAnnouncementButton({
  communityId,
  defaultText = "",
}: {
  communityId: string;
  defaultText?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="w-full">
      <Button
        variant="secondary"
        fullWidth
        className="justify-start"
        disabled={pending}
        onClick={() => {
          const text = window.prompt(
            "Announcement for your community",
            defaultText,
          );
          if (text == null) return;
          startTransition(async () => {
            try {
              await updateCommunityAnnouncementAction(communityId, text);
              setMessage("Announcement saved.");
              router.refresh();
            } catch (e) {
              setMessage(userFacingErrorMessage(e, "Save failed."));
            }
          });
        }}
      >
        <Megaphone className="h-4 w-4" aria-hidden />
        Post announcement
      </Button>
      {message ? (
        <p className="mt-2 text-xs text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
