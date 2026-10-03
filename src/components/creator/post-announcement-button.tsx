"use client";

import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import { Megaphone } from "lucide-react";
import { useState } from "react";

export function PostAnnouncementButton({
  communitySlug,
  defaultText = "",
}: {
  communitySlug: string;
  defaultText?: string;
}) {
  const { setCreatorAnnouncement, getCreatorAnnouncement } = useDemoStore();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="w-full">
      <Button
        variant="secondary"
        fullWidth
        className="justify-start"
        onClick={() => {
          const text = window.prompt(
            "Announcement for your community (demo — saved on this device)",
            getCreatorAnnouncement(communitySlug, defaultText),
          );
          if (text == null) return;
          setCreatorAnnouncement(communitySlug, text);
          setMessage("Announcement saved (demo).");
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
