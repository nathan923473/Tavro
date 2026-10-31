import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthSetupNotice() {
  if (!isSupabaseConfigured()) {
    return (
      <Card className="mx-auto mb-4 max-w-md border-amber-500/30 bg-amber-500/5">
        <p className="text-sm text-muted-foreground">
          Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
          <code className="text-xs">.env.local</code> to enable sign-up and login.
        </p>
      </Card>
    );
  }

  return null;
}
