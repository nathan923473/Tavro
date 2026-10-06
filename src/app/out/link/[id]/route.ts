import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const home = new URL("/", request.url);
  const supabase = await createClient();

  const { data: url, error } = await supabase.rpc("record_creator_link_click", {
    p_link_id: id,
  });

  if (error || !url || typeof url !== "string") {
    return NextResponse.redirect(home);
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.redirect(home);
    }
    return NextResponse.redirect(parsed.toString());
  } catch {
    return NextResponse.redirect(home);
  }
}
