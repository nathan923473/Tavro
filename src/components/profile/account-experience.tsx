import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import Link from "next/link";

export async function AccountExperience() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    return (
      <Card>
        <h2 className="font-semibold">Your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign up as a member — apply to become a creator later.
        </p>
        <div className="mt-3 grid gap-2">
          <Link
            href="/signup"
            className="flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
          >
            Log in
          </Link>
        </div>
      </Card>
    );
  }

  const roleLabel =
    profile?.role === "creator"
      ? "Approved creator"
      : profile?.role === "creator_pending"
        ? "Creator application pending"
        : profile?.role === "admin"
          ? "Admin"
          : "Member";

  return (
    <Card>
      <div className="flex items-start gap-3">
        <UserAvatar
          displayName={profile?.displayName}
          avatarUrl={profile?.avatarUrl}
          size="md"
        />
        <div className="flex-1">
          <p className="font-semibold">
            {profile?.displayName ?? user.email ?? "Member"}
          </p>
          <Badge tone={profile?.role === "creator" ? "success" : "muted"} className="mt-1">
            {roleLabel}
          </Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            One login for member and creator tools. Permissions enforced on the
            server and in Supabase RLS.
          </p>
        </div>
      </div>

      {profile?.role === "creator" || profile?.role === "admin" ? (
        <div className="mt-4 rounded-xl border border-border p-3 text-sm">
          <p className="font-medium">Creator photos</p>
          <p className="mt-1 text-muted-foreground">
            Community banner & challenge images live in Creator Studio.
          </p>
          <Link href="/studio" className="mt-2 inline-block font-semibold text-primary">
            Open Creator Studio →
          </Link>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {profile?.role === "admin" ? (
          <>
            <Link
              href="/admin/creator-applications"
              className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
            >
              Review creator applications
            </Link>
            <Link
              href="/admin/content-reports"
              className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
            >
              Review content reports
            </Link>
            <Link
              href="/admin/analytics"
              className="flex min-h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/5 text-sm font-semibold"
            >
              Founder analytics
            </Link>
          </>
        ) : null}
        {profile?.role === "creator" || profile?.role === "admin" ? (
          <Link
            href="/studio"
            className="flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            Open Creator Studio
          </Link>
        ) : profile?.creatorStatus === "pending" ? (
          <p className="text-sm text-muted-foreground">
            Creator application under review.
          </p>
        ) : (
          <Link
            href="/creators"
            className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
          >
            Become a creator
          </Link>
        )}
        <Link
          href="/challenges/create"
          className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
        >
          Create private challenge
        </Link>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" fullWidth className="text-red-600">
            Sign out
          </Button>
        </form>
      </div>
    </Card>
  );
}
