import { Card } from "@/components/ui/card";
import type { CreatorCommunity } from "@/types/creator-community";
import { ExternalLink, ShoppingBag } from "lucide-react";

type CreatorShopSectionProps = {
  community: CreatorCommunity;
};

export function CreatorShopSection({ community }: CreatorShopSectionProps) {
  if (!community.shopUrl) return null;

  return (
    <section className="px-4" aria-labelledby="creator-shop-heading">
      <h2 id="creator-shop-heading" className="mb-2 text-base font-semibold">
        Creator&apos;s shop
      </h2>
      <Card>
        <div className="flex gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: community.brandColor }}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {community.shopLabel ?? "Visit creator shop"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional — free challenges never require a purchase.
            </p>
            <a
              href={community.shopUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Open shop
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            {community.affiliateDisclosure ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {community.affiliateDisclosure}
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    </section>
  );
}
