import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { checkSupabaseConnection } from "@/lib/supabase/server";
import { Database } from "lucide-react";

export async function SupabaseStatus() {
  const status = await checkSupabaseConnection();

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-muted p-2.5 text-primary">
          <Database className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Supabase</h2>
            {status.connected ? (
              <Badge tone="success">Connected</Badge>
            ) : status.configured ? (
              <Badge tone="warning">Check keys</Badge>
            ) : (
              <Badge tone="muted">Not configured</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{status.message}</p>
          {status.connected ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Run migrations <code className="text-[11px]">002</code> and{" "}
              <code className="text-[11px]">003_fix_signup_profile_trigger.sql</code> in
              Supabase SQL Editor if sign-up fails. See{" "}
              <code className="text-[11px]">docs/supabase-auth-setup.md</code>.
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
