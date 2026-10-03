import { BackLink } from "@/components/layout/back-link";
import {
  backLabelForHref,
  getBackHref,
} from "@/lib/back-navigation";

type StandalonePageHeaderProps = {
  pathname: string;
  title?: string;
  backHref?: string;
};

/** Top bar with back for pages outside the main tab shell (join, invite, auth). */
export function StandalonePageHeader({
  pathname,
  title,
  backHref,
}: StandalonePageHeaderProps) {
  const href = backHref ?? getBackHref(pathname);
  if (!href) return null;

  return (
    <div className="mb-4 flex items-center gap-2">
      <BackLink href={href} label={backLabelForHref(href)} />
      {title ? (
        <span className="truncate text-sm font-medium text-muted-foreground">
          {title}
        </span>
      ) : null}
    </div>
  );
}
