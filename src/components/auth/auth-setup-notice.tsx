import { Card } from "@/components/ui/card";
import { isAdminSignupEnabled } from "@/lib/supabase/admin";
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

  if (isAdminSignupEnabled()) {
    return null;
  }

  return (
    <Card className="mx-auto mb-4 max-w-md border-primary/20 bg-secondary/30">
      <p className="text-sm font-medium">One-time setup for easy sign-up</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
        <li>
          Supabase → SQL Editor → run{" "}
          <code className="text-xs">003_fix_signup_profile_trigger.sql</code>
        </li>
        <li>
          Authentication → Providers → Email → turn off{" "}
          <strong>Confirm email</strong>
        </li>
        <li>
          Optional: add{" "}
          <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
          <code className="text-xs">.env.local</code> (server only) for sign-up
          without email limits — see{" "}
          <code className="text-xs">docs/supabase-auth-setup.md</code>
        </li>
      </ol>
    </Card>
  );
}
