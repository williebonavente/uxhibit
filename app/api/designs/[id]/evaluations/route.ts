import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request, context: { params: { id: string }}) {
  const supabase = await createClient();
  const { id } = await context.params;

  const { data: frames, error } = await supabase
    .from("design_frame_evaluations")
    .select("*")
    .eq("design_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Only return frames that have been evaluated (i.e., have AI data)
  const evaluatedFrames = (frames || []).filter(f => f.ai_data);
  // console.log("Evaluated frames for design", id, evaluatedFrames);
  return NextResponse.json({ results: evaluatedFrames });
}