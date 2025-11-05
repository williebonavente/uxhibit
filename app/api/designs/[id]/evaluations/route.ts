import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Get version from query string
  const url = new URL(req.url);
  const versionId = url.searchParams.get("version");

  let query = supabase
    .from("design_frame_evaluations")
    .select("*")
    .eq("design_id", id);

  if (versionId) {
    query = query.eq("version_id", versionId);
  }

  const { data: frames, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Only return frames that have been evaluated (i.e., have AI data)
  const evaluatedFrames = (frames || []).filter((f) => f.ai_data);
  return NextResponse.json({ results: evaluatedFrames });
}
