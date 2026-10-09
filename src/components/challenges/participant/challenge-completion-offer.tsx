import { Card } from "@/components/ui/card";
import Link from "next/link";

export type ChallengeCompletionOffer = {
  headline: string;
  message: string;
  linkLabel: string;
  linkHref: string;
};

export function ChallengeCompletionOfferCard({ offer }: { offer: ChallengeCompletionOffer }) {
  return (
    <Card className="space-y-2 border-dashed border-primary/30 bg-secondary/20 text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Creator offer · optional
      </p>
      <p className="font-semibold">{offer.headline}</p>
      {offer.message ? (
        <p className="text-sm text-muted-foreground">{offer.message}</p>
      ) : null}
      <Link
        href={offer.linkHref}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        rel="noopener noreferrer sponsored"
      >
        {offer.linkLabel}
      </Link>
    </Card>
  );
}
