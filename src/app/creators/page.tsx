import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { APP_NAME, APP_TAGLINE, BRAND_COLORS } from "@/lib/branding";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  BarChart3,
  Megaphone,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: `Creators · ${APP_NAME}`,
  description:
    "Become a Tavro creator: run free challenges, build community, track participation, and promote your coaching.",
};

const benefits = [
  {
    icon: Sparkles,
    title: "Run free challenges",
    body: "Publish public habit challenges your audience can join in one tap — no paywalls.",
  },
  {
    icon: Users,
    title: "Build a community",
    body: "A public creator page for your brand, followers, and ongoing programs.",
  },
  {
    icon: BarChart3,
    title: "Track participation",
    body: "See joins, check-ins, and engagement so you know what resonates.",
  },
  {
    icon: Megaphone,
    title: "Promote coaching programs",
    body: "Share shop links, offers, and announcements while challenges stay free to join.",
  },
] as const;

export default async function CreatorsLandingPage() {
  const { user, profile } = await getCurrentUserProfile();
  const isCreator =
    profile?.role === "creator" || profile?.role === "admin";
  const applyHref = user
    ? isCreator
      ? "/studio"
      : "/become-creator"
    : "/signup?next=/become-creator";

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <div className="animate-fade-up px-4 py-6">
        <StandalonePageHeader pathname="/creators" title="Creators" />

        <section
          className="mt-4 overflow-hidden rounded-2xl px-5 py-8 text-white"
          style={{
            background: `linear-gradient(145deg, ${BRAND_COLORS.royalBlue} 0%, ${BRAND_COLORS.navy} 70%)`,
          }}
        >
          <p className="text-sm font-semibold tracking-wide text-white/80">
            {APP_NAME}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Grow with free creator challenges
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            {APP_TAGLINE} Host challenges, build your community, and keep using
            the same {APP_NAME} account your members already love.
          </p>
          <div className="mt-6">
            <Link
              href={applyHref}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-[var(--navy,#1B2440)]"
              style={{ color: BRAND_COLORS.navy }}
            >
              {isCreator ? "Open Creator Studio" : "Apply to Become a Creator"}
            </Link>
          </div>
          {!user ? (
            <p className="mt-3 text-center text-xs text-white/70">
              Already have an account?{" "}
              <Link
                href="/login?next=/become-creator"
                className="font-medium text-white underline-offset-2 hover:underline"
              >
                Log in to apply
              </Link>
            </p>
          ) : null}
        </section>

        <section className="mt-8 space-y-3" aria-labelledby="creator-benefits">
          <h2 id="creator-benefits" className="px-1 text-base font-semibold">
            Why creators use {APP_NAME}
          </h2>
          <ul className="space-y-2">
            {benefits.map((item) => (
              <li key={item.title}>
                <BenefitRow
                  icon={<item.icon className="h-5 w-5 text-primary" aria-hidden />}
                  title={item.title}
                  body={item.body}
                />
              </li>
            ))}
          </ul>
        </section>

        <Card className="mt-8 border-primary/20 bg-secondary/30">
          <h2 className="font-semibold">How approval works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Submit a short application (same login as members).</li>
            <li>Our team reviews it manually.</li>
            <li>
              When approved, Creator Studio unlocks on your existing account —
              no second signup.
            </li>
          </ol>
          <div className="mt-4">
            <Link href={applyHref}>
              <Button fullWidth>
                {isCreator ? "Open Creator Studio" : "Apply to Become a Creator"}
              </Button>
            </Link>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not ready to host?{" "}
          <Link href="/discover" className="font-medium text-primary">
            Explore free challenges
          </Link>
        </p>
      </div>
    </div>
  );
}

function BenefitRow({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card padding="sm" className="flex gap-3">
      <div className="mt-0.5 shrink-0 rounded-xl bg-primary/10 p-2">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
      </div>
    </Card>
  );
}
