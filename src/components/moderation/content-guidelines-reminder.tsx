import Link from "next/link";

export function ContentGuidelinesReminder({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground ${className}`.trim()}>
      Keep uploads respectful —{" "}
      <Link href="/community-guidelines" className="font-medium text-primary underline-offset-2 hover:underline">
        Community guidelines
      </Link>{" "}
      for more info
    </p>
  );
}
