import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/cn";

type ChallengeCreatorLineProps = {
  displayName: string;
  avatarUrl?: string | null;
  /** e.g. community name when displayName is the person */
  subtitle?: string | null;
  className?: string;
  avatarClassName?: string;
};

export function ChallengeCreatorLine({
  displayName,
  avatarUrl,
  subtitle,
  className,
  avatarClassName,
}: ChallengeCreatorLineProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <UserAvatar
        displayName={displayName}
        avatarUrl={avatarUrl}
        size="sm"
        className={cn("rounded-xl", avatarClassName)}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
