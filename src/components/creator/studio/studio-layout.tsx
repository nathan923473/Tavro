import { StudioNav } from "@/components/creator/studio/studio-nav";
import type { ReactNode } from "react";

export function StudioLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="animate-fade-up">
      <div className="space-y-3 px-4 pt-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <StudioNav />
      </div>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </div>
  );
}
