import { WifiOff } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-2xl bg-muted p-4 text-muted-foreground">
        <WifiOff className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        Tavro saved this page so you can still open the app. Reconnect to
        sync check-ins and group messages.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </Link>
    </div>
  );
}
