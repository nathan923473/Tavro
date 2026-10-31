import { submitCreatorApplication } from "@/app/(app)/become-creator/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function BecomeCreatorForm({ reapply = false }: { reapply?: boolean }) {
  return (
    <Card>
      <h2 className="font-semibold">
        {reapply ? "Apply again" : "Apply to become a creator"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {reapply
          ? "An admin allowed another application. Creator Studio still waits on verification and approval."
          : "Free for creators. Creator Studio unlocks after you verify your social account and an admin approves you."}
      </p>
      <form action={submitCreatorApplication} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="display_name">
            Creator name
          </label>
          <input
            id="display_name"
            name="display_name"
            required
            minLength={2}
            placeholder="e.g. Coach Sarah or Fit With Emma"
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The name participants see on your creator profile and challenges.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="social_link">
            Social profile
          </label>
          <input
            id="social_link"
            name="social_link"
            type="url"
            required
            placeholder="https://instagram.com/yourhandle"
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The public account you control. You will prove ownership after applying.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="coaching_focus">
            Coaching focus
          </label>
          <input
            id="coaching_focus"
            name="coaching_focus"
            required
            minLength={2}
            placeholder="Strength, running, beginner fitness"
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="motivation">
            Why do you want to host free challenges?
          </label>
          <textarea
            id="motivation"
            name="motivation"
            required
            minLength={10}
            rows={4}
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
