"use client";

import { searchDiscoverAction } from "@/app/(app)/discover/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DiscoverChallenge, DiscoverCreator } from "@/lib/data/discover";
import { publicChallengePath } from "@/lib/site-url";
import { CalendarRange, Gift, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

function ChallengeRow({ c }: { c: DiscoverChallenge }) {
  const href = publicChallengePath(c.communitySlug, c.inviteSlug);
  return (
    <li>
      <Card className="overflow-hidden p-0">
        {c.coverUrl ? (
          <div className="relative h-28 bg-muted">
            <Image src={c.coverUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.communityName}</p>
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
              {c.startDate} → {c.endDate}
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
            View challenge
          </Link>
        </div>
      </Card>
    </li>
  );
}

export function DiscoverInteractive({
  initial,
}: {
  initial: {
    active: DiscoverChallenge[];
    upcoming: DiscoverChallenge[];
    featured: DiscoverChallenge[];
    creators: DiscoverCreator[];
  };
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    challenges: DiscoverChallenge[];
    creators: DiscoverCreator[];
  } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card className="flex gap-2 p-3">
        <Search className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators or challenges"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <Button
          type="button"
          className="shrink-0 px-3 py-2 text-sm"
          disabled={pending || !query.trim()}
          onClick={() =>
            startTransition(async () => {
              setResults(await searchDiscoverAction(query.trim()));
            })
          }
        >
          Search
        </Button>
      </Card>

      {results ? (
        <section>
          <h2 className="mb-2 text-base font-semibold">Search results</h2>
          {results.challenges.length === 0 && results.creators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {results.challenges.map((c) => (
                  <ChallengeRow key={c.id} c={c} />
                ))}
              </ul>
              <ul className="mt-4 space-y-2">
                {results.creators.map((cr) => (
                  <li key={cr.id}>
                    <Link href={`/creator/${cr.slug}`} className="block rounded-xl border border-border p-3">
                      <p className="font-semibold">{cr.communityName}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{cr.bio}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
        <>
          <Section title="Featured challenges" items={initial.featured} />
          <Section title="Active challenges" items={initial.active} />
          <Section title="Upcoming challenges" items={initial.upcoming} />
          <section>
            <h2 className="mb-2 text-base font-semibold">Creators</h2>
            <ul className="space-y-2">
              {initial.creators.map((cr) => (
                <li key={cr.id}>
                  <Link
                    href={`/creator/${cr.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-sm font-bold">
                      {cr.communityName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{cr.communityName}</p>
                      <p className="text-xs text-muted-foreground">
                        {cr.memberCount} followers · {cr.ownerName}
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

function Section({ title, items }: { title: string; items: DiscoverChallenge[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <ul className="space-y-3">
        {items.map((c) => (
          <ChallengeRow key={c.id} c={c} />
        ))}
      </ul>
    </section>
  );
}
