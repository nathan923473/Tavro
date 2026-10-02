import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* set from Server Component */
        }
      },
    },
  });
}

export async function checkSupabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      message: "Add Supabase URL and anon key to .env.local",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        configured: true,
        connected: false,
        message: error.message,
      };
    }
    return {
      configured: true,
      connected: true,
      message: "Connected to Supabase (auth ready)",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Connection failed";
    return {
      configured: true,
      connected: false,
      message,
    };
  }
}
