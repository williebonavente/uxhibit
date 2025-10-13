import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { results, designVersionId } = body;

  // Map camelCase keys to snake_case and remove camelCase keys
  const mappedResults = Array.isArray(results)
    ? results.map(({
      averageContrastScore,
      frameId,
      frameName,
      textNodes,
      layoutScore,
      layoutIssues,
      layoutSummary,
      ...rest
    }) => ({
      ...rest,
      average_contrast_score: averageContrastScore,
      frame_id: frameId,
      frame_name: frameName,
      text_nodes: textNodes,
      design_version_id: designVersionId,
      layout_score: layoutScore,
      layout_issues: layoutIssues,
      layout_summary: layoutSummary,
    }))
    : [];

  const { error } = await supabase
    .from("accessibility_results")
    .insert(mappedResults);

  if (error) {
    console.error("Supabase insert error: ", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}