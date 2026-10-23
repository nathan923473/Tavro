import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_NAME, BRAND_COLORS } from "@/lib/branding";
import { CalendarRange, LineChart, Megaphone, Users } from "lucide-react";
import Link from "next/link";

export function CreatorsLanding({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-10">
      <header
        className="px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white"
        style={{
          background: `linear-gradient(165deg, ${BRAND_COLORS.royalBlue} 0%, ${BRAND_COLORS.navy} 85%)`,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
          {APP_NAME} for coaches
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight">
          Turn your followers into a community that makes progress
        </h1>
        <p className="mt-3 text-sm text-white/90">
          Run free fitness challenges, keep participants consistent between programs, and
          grow a lasting audience — without paywalls or complicated setup.
        </p>
        <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium">
          Free for approved creators at launch
        </p>
        <Link
          href={loggedIn ? "#apply" : "/login?next=/creators%23apply"}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-mint-subtle text-sm font-semibold text-foreground"
        >
          Apply to become a creator
        </Link>
      </header>

      <div className="space-y-4 px-4 py-6">
        <Card>
          <h2 className="font-semibold">Why coaches use {APP_NAME}</h2>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <CalendarRange className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Run free public challenges with clear start dates and daily activities
            </li>
            <li className="flex gap-2">
              <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Build a follower community that stays engaged after each challenge ends
            </li>
            <li className="flex gap-2">
              <LineChart className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              See aggregate participation — not private health data
            </li>
            <li className="flex gap-2">
              <Megaphone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Share coaching or program links when participants are ready
            </li>
          </ul>
        </Card>

        <Card className="overflow-hidden p-0">
          <div
            className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: BRAND_COLORS.royalBlue }}
          >
            Product preview
          </div>
          <div className="space-y-2 bg-secondary/30 p-4">
            <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
              <p className="text-xs font-semibold text-primary">Creator Studio</p>
              <p className="mt-1 text-sm font-medium">Overview · Challenges · Community</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Publish challenges, post updates, and manage your public creator page.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
              <p className="text-xs font-semibold text-primary">Participant experience</p>
              <p className="mt-1 text-sm font-medium">Daily check-ins · progress · share</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Members opt in to share progress — no spam, no forced posts.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">How it works</h2>
          <ol className="mt-3 space-y-3 text-sm">
            <li>
              <span className="font-semibold text-primary">1.</span> Apply — we review
              manually to keep the community trusted.
            </li>
            <li>
              <span className="font-semibold text-primary">2.</span> Set up your creator
              page and publish a free challenge.
            </li>
            <li>
              <span className="font-semibold text-primary">3.</span> Share your challenge
              link; participants join and build consistency with you.
            </li>
          </ol>
        </Card>

        <section id="apply" className="scroll-mt-4">
          <Card className="text-center">
            <h2 className="font-semibold">Apply to become a creator</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Same account as members · manual review · free at launch
            </p>
            {loggedIn ? (
              <Link href="/become-creator" className="mt-4 block">
                <Button fullWidth>Continue to application</Button>
              </Link>
            ) : (
              <>
                <Link href="/login?next=/become-creator" className="mt-4 block">
                  <Button fullWidth>Log in to apply</Button>
                </Link>
                <Link
                  href="/signup?next=/become-creator"
                  className="mt-2 block text-sm font-medium text-primary"
                >
                  Create a free member account
                </Link>
              </>
            )}
          </Card>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Already a member?{" "}
          <Link href="/challenges" className="font-medium text-primary">
            Explore challenges
          </Link>
        </p>
      </div>
    </div>
  );
}
