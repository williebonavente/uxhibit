import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only

export async function GET(req: Request) {
  const { searchParams } = new globalThis.URL(req.url);
  const rawPath = searchParams.get("path");
  const expires = Number(searchParams.get("expires") || 3600); // 1h

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }
  if (!rawPath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Ensure we pass the exact storage key (relative to bucket), decode %20 etc.
  const path = decodeURIComponent(rawPath);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, expires);

  if (error || !data?.signedUrl) {
    // Helpful diagnostics
    return NextResponse.json(
      { error: "Could not sign URL", detail: error?.message, path },
      { status: 404 }
    );
  }

  return NextResponse.redirect(data.signedUrl, 302);
}