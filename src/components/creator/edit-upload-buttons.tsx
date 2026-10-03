"use client";

import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

export function EditUploadButtons() {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        fullWidth
        className="justify-start"
        onClick={() =>
          window.alert("Image upload will use Supabase Storage in production.")
        }
      >
        <ImageIcon className="h-4 w-4" aria-hidden />
        Upload avatar
      </Button>
      <Button
        type="button"
        variant="outline"
        fullWidth
        className="justify-start"
        onClick={() =>
          window.alert("Image upload will use Supabase Storage in production.")
        }
      >
        <ImageIcon className="h-4 w-4" aria-hidden />
        Upload banner
      </Button>
    </>
  );
}
