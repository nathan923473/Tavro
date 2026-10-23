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
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 backdrop-blur-md">
        <div className="space-y-3 px-4 py-3.5">
          <div>
            <h1 className="text-title-lg">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 text-caption">{subtitle}</p>
            ) : null}
          </div>
          <StudioNav />
        </div>
      </header>
      <div className="page-stack px-4 py-4">{children}</div>
    </div>
  );
}
