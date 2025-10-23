import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Wait for the params before using them
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("design_versions")
    .select("*")
    .eq("design_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ versions: data ?? [] });
}
