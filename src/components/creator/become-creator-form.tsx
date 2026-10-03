import { submitCreatorApplication } from "@/app/(app)/become-creator/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function BecomeCreatorForm() {
  return (
    <Card>
      <h2 className="font-semibold">Apply to become a creator</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Free for creators at launch. Public challenges and Creator Studio unlock
        after manual approval.
      </p>
      <form action={submitCreatorApplication} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Creator / brand name</label>
          <input
            name="display_name"
            required
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Why do you want to host free challenges?
          </label>
          <textarea
            name="pitch"
            required
            rows={4}
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Main social link (optional)
          </label>
          <input
            name="social_link"
            type="url"
            placeholder="https://instagram.com/..."
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
          />
        </div>
        <Button type="submit" fullWidth>
          Submit for review
        </Button>
      </form>
    </Card>
  );
}
