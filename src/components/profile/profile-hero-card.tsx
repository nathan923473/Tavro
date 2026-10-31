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
        className="ring-2 ring-white"
      />
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold tracking-tight text-white">{displayName}</p>
        {email ? <p className="truncate text-sm font-medium text-white">{email}</p> : null}
        {workTowards ? (
          <p className="mt-1 text-sm font-medium text-white">
            Focus: {workTowardsLabel(workTowards)}
          </p>
        ) : null}
        {roleLabel ? (
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            {roleLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
