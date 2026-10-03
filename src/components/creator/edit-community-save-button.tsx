"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function EditCommunitySaveButton() {
  const [saved, setSaved] = useState(false);

  return (
    <>
      <Button
        type="button"
        fullWidth
        onClick={() => {
          setSaved(true);
        }}
      >
        Save changes
      </Button>
      {saved ? (
        <p className="text-sm text-muted-foreground" role="status">
          Saved locally for this demo session. Supabase sync comes later.
        </p>
      ) : null}
    </>
  );
}
