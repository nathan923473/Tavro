import { UserAvatar } from "@/components/ui/user-avatar";
import { workTowardsLabel } from "@/lib/member/preferences";
import type { WorkTowards } from "@/lib/member/preferences";

export function ProfileHeroCard({
  displayName,
  email,
  avatarUrl,
  workTowards,
  roleLabel,
}: {
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null; // profile photo URL
  workTowards?: WorkTowards | null;
  roleLabel?: string | null;
}) {
  return (
    <div className="surface-hero flex items-center gap-4 px-4 py-4 text-primary-foreground">
      <UserAvatar
        displayName={displayName}
        avatarUrl={avatarUrl}
        size="lg"
        className="ring-2 ring-white/30"
      />
      <div className="min-w-0 flex-1">
        <p className="text-title-lg text-white">{displayName}</p>
        {email ? <p className="truncate text-caption text-white/80">{email}</p> : null}
        {workTowards ? (
          <p className="mt-1 text-sm text-white/90">
            Focus: {workTowardsLabel(workTowards)}
          </p>
        ) : null}
        {roleLabel ? (
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-white/70">
            {roleLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
