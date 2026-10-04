import { parsePresetAvatar } from "@/lib/storage/avatars";
import { cn } from "@/lib/cn";
import Image from "next/image";

type UserAvatarProps = {
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-24 w-24 text-2xl",
};

export function UserAvatar({
  displayName,
  avatarUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const initials =
    displayName
      ?.split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const preset = parsePresetAvatar(avatarUrl);
  const sizeClass = sizeMap[size];

  if (preset) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl font-bold text-white shadow-sm",
          sizeClass,
          className,
        )}
        style={{ background: preset.gradient }}
        aria-hidden
      >
        {preset.emoji}
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-2xl bg-muted",
          sizeClass,
          className,
        )}
      >
        <Image
          src={avatarUrl}
          alt=""
          fill
          className="object-cover"
          sizes={size === "lg" ? "96px" : size === "md" ? "56px" : "40px"}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-secondary font-bold text-secondary-foreground",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
