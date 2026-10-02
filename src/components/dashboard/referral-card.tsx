import { Card } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { userReferralPath } from "@/lib/site-url";
import { UserPlus } from "lucide-react";

type ReferralCardProps = {
  referralCode: string;
};

export function ReferralCard({ referralCode }: ReferralCardProps) {
  return (
    <Card>
      <div className="flex gap-3">
        <div className="rounded-xl bg-accent/15 p-2.5 text-accent">
          <UserPlus className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">Invite a friend</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Streakly is free. Share your link — they can join solo or hop into
            a challenge with you.
          </p>
          <div className="mt-3">
            <CopyLinkButton
              url={userReferralPath(referralCode)}
              label="Copy referral link"
              fullWidth
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
