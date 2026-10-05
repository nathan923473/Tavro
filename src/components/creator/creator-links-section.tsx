import { Card } from "@/components/ui/card";
import type { CreatorLinkRow } from "@/types/creator-studio";
import { ExternalLink } from "lucide-react";

export function CreatorLinksSection({ links }: { links: CreatorLinkRow[] }) {
  const visible = links.filter((l) => l.isPublic);
  if (!visible.length) return null;

  return (
    <section className="px-4" aria-labelledby="creator-links-heading">
      <h2 id="creator-links-heading" className="mb-2 text-base font-semibold">
        Links
      </h2>
      <ul className="space-y-2">
        {visible.map((link) => (
          <li key={link.id}>
            <Card padding="sm">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-between gap-2 text-sm font-medium"
              >
                <span>{link.label}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </a>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
