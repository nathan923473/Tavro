"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import Link from "next/link";

export function ChallengePreview() {
  const { myChallengesList } = useDemoStore();
  const joined = myChallengesList();

  return (
    <section className="space-y-3" aria-labelledby="challenges-preview-heading">
      <div className="flex items-center justify-between px-1">
        <h2 id="challenges-preview-heading" className="text-base font-semibold">
          Your challenges
        </h2>
        <Link href="/challenges" className="text-sm font-medium text-primary">
          See all
        </Link>
      </div>
      {joined.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            No challenges yet — join one from the Challenges tab.
          </p>
          <Link href="/challenges" className="mt-2 inline-block text-sm font-semibold text-primary">
            Discover challenges
          </Link>
        </Card>
      ) : (
        <ul className="space-y-2">
          {joined.map((challenge) => (
            <li key={challenge.id}>
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{challenge.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      with {challenge.creatorName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge>{challenge.progressPercent}%</Badge>
                    <Badge tone="muted">Free</Badge>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${challenge.progressPercent}%` }}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
