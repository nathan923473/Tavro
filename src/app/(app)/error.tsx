"use client";

import { mainTabFromPath } from "@/components/navigation/instant-tab-host";
import { Button } from "@/components/ui/button";
import { userFacingErrorMessage } from "@/lib/errors/user-message";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const tab = mainTabFromPath(pathname);
    if (!tab) return;
    window.dispatchEvent(new CustomEvent("tavro-tab-ready", { detail: tab }));
  }, [pathname]);

  return (
    <div className="px-4 py-8">
      <h1 className="text-xl font-semibold">This page couldn’t load</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {userFacingErrorMessage(error, "Something went wrong while loading this screen.")}
      </p>
      <Button type="button" className="mt-4" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
