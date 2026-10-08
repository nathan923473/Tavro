"use client";

import { searchDiscoverAction } from "@/app/(app)/discover/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DiscoverChallenge, DiscoverCreator } from "@/lib/data/discover";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { isChallengeUpcoming } from "@/lib/challenge-countdown";
import { publicChallengePath } from "@/lib/site-url";
import { ChallengeCreatorLine } from "@/components/challenges/challenge-creator-line";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CalendarRange, Compass, Gift, Search, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { creatorCommunityBrandLabel } from "@/lib/creator-display-name";
import { useState, useTransition, type FormEvent } from "react";

function ChallengeRow({
  c,
  viewerUserId,
}: {
  c: DiscoverChallenge;
  viewerUserId?: string | null;
}) {
  const isOwner = Boolean(viewerUserId && viewerUserId === c.createdById);
  const href = isOwner
    ? `/challenges/${c.id}`
    : publicChallengePath(c.communitySlug, c.inviteSlug);
  const cta = isOwner ? "Open challenge" : "View challenge";
  const upcoming = isChallengeUpcoming({ startAt: c.startAt, startDate: c.startDate });
  return (
    <li>
      <Card
        className={`overflow-hidden p-0 ${upcoming ? "ring-2 ring-amber-400/50" : ""}`}
      >
        {upcoming ? (
          <ChallengeStartCountdown
            startAt={c.startAt}
            startDate={c.startDate}
            challengeTimezone={c.challengeTimezone}
            variant="strip"
            label="Starting in"
          />
        ) : null}
        {c.coverUrl ? (
          <div className="relative h-28 bg-muted">
            <Image src={c.coverUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{c.title}</h3>
                {upcoming ? (
                  <Badge tone="warning" className="uppercase tracking-wide">
                    Upcoming
                  </Badge>
                ) : null}
              </div>
              <ChallengeCreatorLine
                displayName={c.creatorName}
                avatarUrl={c.creatorAvatarUrl}
                subtitle={c.communityName !== c.creatorName ? c.communityName : null}
                className="mt-1"
              />
            </div>
            <Badge tone="success" className="gap-1 shrink-0">
              <Gift className="h-3 w-3" aria-hidden />
              Free
            </Badge>
          </div>
          {c.shortDescription ? (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.shortDescription}</p>
          ) : null}
          <p className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5" aria-hidden />
              <ChallengeDateRange
                startDate={c.startDate}
                endDate={c.endDate}
                challengeTimezone={c.challengeTimezone}
              />
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {c.participants} joined
            </span>
          </p>
          <Link
            href={href}
            className="mt-3 flex min-h-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            {cta}
          </Link>
        </div>
      </Card>
    </li>
  );
}

type DiscoverInteractiveProps = {
  initial: {
    active: DiscoverChallenge[];
    upcoming: DiscoverChallenge[];
    featured: DiscoverChallenge[];
    creators: DiscoverCreator[];
  };
  /** Full page vs embedded on Challenges tab (shorter lists + link to /discover). */
  variant?: "full" | "embedded";
  viewerUserId?: string | null;
};

export function DiscoverInteractive({
  initial,
  variant = "full",
  viewerUserId = null,
}: DiscoverInteractiveProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    challenges: DiscoverChallenge[];
    creators: DiscoverCreator[];
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const embedded = variant === "embedded";

  function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    startTransition(async () => {
      setResults(await searchDiscoverAction(trimmed));
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  const limits = embedded
    ? { featured: 2, active: 3, upcoming: 2, creators: 4 }
    : { featured: 999, active: 999, upcoming: 999, creators: 999 };

  return (
    <div className="space-y-5">
      <section
        id="discover"
        aria-labelledby="discover-search-heading"
        className="scroll-mt-4 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4 shadow-sm ring-1 ring-primary/10"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
            <Compass className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="discover-search-heading" className="text-lg font-semibold tracking-tight">
              Find creators &amp; challenges
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Search free public challenges and approved creator communities.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-2">
          <label className="sr-only" htmlFor="discover-search-input">
            Search creators or challenges
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="discover-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “walking”, “Sarah”, or a challenge name…"
                className="min-h-12 w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-base shadow-inner outline-none ring-primary focus:ring-2"
              />
            </div>
            <Button type="submit" className="min-h-12 shrink-0 px-6 text-base" disabled={pending || !query.trim()}>
              {pending ? "Searching…" : "Search"}
            </Button>
          </div>
        </form>

        {embedded ? (
          <Link
            href="/discover"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            Open full Discover page
            <span aria-hidden>→</span>
          </Link>
        ) : null}
      </section>

      {results ? (
        <section aria-labelledby="search-results-heading">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <h2 id="search-results-heading" className="text-base font-semibold">
              Search results
            </h2>
            <button
              type="button"
              className="text-sm font-medium text-primary"
              onClick={() => {
                setResults(null);
                setQuery("");
              }}
            >
              Clear
            </button>
          </div>
          {results.challenges.length === 0 && results.creators.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">No matches — try another name.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {results.challenges.map((c) => (
                  <ChallengeRow key={c.id} c={c} viewerUserId={viewerUserId} />
                ))}
              </ul>
              <ul className="mt-4 space-y-2">
                {results.creators.map((cr) => {
                  const brand = creatorCommunityBrandLabel(
                    cr.communityName,
                    cr.ownerName,
                  );
                  return (
                    <li key={cr.id}>
                      <Link
                        href={`/creator/${cr.slug}`}
                        className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                      >
                        <UserAvatar
                          displayName={cr.ownerName}
                          avatarUrl={cr.avatarUrl}
                          size="md"
                          className="rounded-xl"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold leading-snug">{cr.ownerName}</p>
                          {brand ? (
                            <p className="text-xs text-muted-foreground">{brand}</p>
                          ) : null}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {cr.bio}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      ) : (
        <>
          <Section
            title="Featured challenges"
            items={initial.featured.slice(0, limits.featured)}
            seeAllHref={embedded && initial.featured.length > limits.featured ? "/discover" : undefined}
            viewerUserId={viewerUserId}
          />
          <Section
            title="Active challenges"
            items={initial.active.slice(0, limits.active)}
            seeAllHref={embedded && initial.active.length > limits.active ? "/discover" : undefined}
            viewerUserId={viewerUserId}
          />
          <Section
            title="Upcoming challenges"
            items={initial.upcoming.slice(0, limits.upcoming)}
            seeAllHref={embedded && initial.upcoming.length > limits.upcoming ? "/discover" : undefined}
            viewerUserId={viewerUserId}
          />
          <section aria-labelledby="discover-creators-heading">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <h2
                id="discover-creators-heading"
                className="flex items-center gap-2 text-base font-semibold"
              >
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                Creators
              </h2>
              {embedded && initial.creators.length > limits.creators ? (
                <Link href="/discover" className="text-sm font-medium text-primary">
                  See all
                </Link>
              ) : null}
            </div>
            <ul className="space-y-2">
              {initial.creators.slice(0, limits.creators).map((cr) => (
                <li key={cr.id}>
                  <Link
                    href={`/creator/${cr.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-muted/40"
                  >
                    <UserAvatar
                      displayName={cr.ownerName}
                      avatarUrl={cr.avatarUrl}
                      size="md"
                      className="rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{cr.ownerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {cr.memberCount} followers
                        {(() => {
                          const brand = creatorCommunityBrandLabel(
                            cr.communityName,
                            cr.ownerName,
                          );
                          return brand ? ` · ${brand}` : "";
                        })()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  seeAllHref,
  viewerUserId,
}: {
  title: string;
  items: DiscoverChallenge[];
  seeAllHref?: string;
  viewerUserId?: string | null;
}) {
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {seeAllHref ? (
          <Link href={seeAllHref} className="text-sm font-medium text-primary">
            See all
          </Link>
        ) : null}
      </div>
      <ul className="space-y-3">
        {items.map((c) => (
          <ChallengeRow key={c.id} c={c} viewerUserId={viewerUserId} />
        ))}
      </ul>
    </section>
  );
}
