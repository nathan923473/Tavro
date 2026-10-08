import { Badge } from "@/components/ui/badge";
import { checkMediaDatabaseSetup } from "@/lib/data/media-setup";
import { checkSupabaseConnection } from "@/lib/supabase/server";

/** Admin-only: connection and media migration hints (not shown to members/creators). */
export async function AdminSupabaseDiagnostics() {
  const [status, media] = await Promise.all([
    checkSupabaseConnection(),
    checkMediaDatabaseSetup(),
  ]);

  return (
    <details className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
      <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
        Supabase diagnostics (admin)
      </summary>
      <div className="mt-2 space-y-2 border-t border-border pt-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">Auth / API</span>
          {status.connected ? (
            <Badge tone="success">Connected</Badge>
          ) : status.configured ? (
            <Badge tone="warning">Check keys</Badge>
          ) : (
            <Badge tone="muted">Not configured</Badge>
          )}
        </div>
        <p>{status.message}</p>
        {status.connected ? (
          <p>
            Photo uploads:{" "}
            {media.ok ? (
              <span className="font-medium text-foreground">schema OK</span>
            ) : (
              <>
                run{" "}
                <code className="text-[10px]">009b_one_shot_fix_media.sql</code> — {media.message}
              </>
            )}
          </p>
        ) : null}
      </div>
    </details>
  );
}
