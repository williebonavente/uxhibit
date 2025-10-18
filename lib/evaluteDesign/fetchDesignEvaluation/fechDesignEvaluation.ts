import { createClient } from "@/utils/supabase/client";
import type { FrameEvaluation } from "@/lib/types/evalResponse";

/**
 * Fetch latest version + frame evaluations for a design and return combined array.
 * Returns an empty array on missing designId or on errors.
 */
export async function fetchEvaluationsForDesign(designId?: string): Promise<FrameEvaluation[]> {
  if (!designId) return [];

  try {
    const supabase = createClient();

    const { data: versionData, error: versionError } = await supabase
      .from("design_versions")
      .select(`
        id, design_id, version, file_key, node_id, thumbnail_url, created_by,
        ai_summary, ai_data, snapshot, created_at, updated_at, total_score
      `)
      .eq("design_id", designId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (versionError) {
      console.error("[fetchEvaluationsForDesign] Failed to fetch overall version:", versionError);
      return [];
    }
    if (!versionData) {
      console.warn("[fetchEvaluationsForDesign] No version data for design:", designId);
      return [];
    }

    if (
      !versionData.ai_summary ||
      !versionData.ai_data ||
      typeof versionData.total_score !== "number" ||
      versionData.total_score === 0
    ) {
      console.warn("[fetchEvaluationsForDesign] Skipping incomplete/placeholder version:", versionData);
      return [];
    }

    let aiData: any = versionData.ai_data;
    if (typeof aiData === "string") {
      try {
        aiData = JSON.parse(aiData);
      } catch (e) {
        console.error("[fetchEvaluationsForDesign] Failed to parse ai_data:", e, versionData.ai_data);
        aiData = {};
      }
    }

    const overall: FrameEvaluation = {
      id: "overallFrame",
      design_id: versionData.design_id,
      version_id: versionData.id,
      file_key: versionData.file_key,
      node_id: versionData.node_id,
      thumbnail_url: versionData.thumbnail_url,
      owner_id: versionData.created_by,
      ai_summary: versionData.ai_summary,
      ai_data: aiData,
      snapshot: versionData.snapshot,
      created_at: versionData.created_at,
      updated_at: versionData.updated_at,
      total_score: versionData.total_score,
    };

    const { data: frameData, error: frameError } = await supabase
      .from("design_frame_evaluations")
      .select(`
        id, design_id, version_id, file_key, node_id, thumbnail_url, owner_id,
        ai_summary, ai_data, snapshot, created_at, updated_at
      `)
      .eq("design_id", designId)
      .eq("version_id", versionData.id)
      .order("created_at", { ascending: true });

    if (frameError) {
      console.error("[fetchEvaluationsForDesign] Failed to fetch frame evaluations:", frameError);
      return [overall];
    }

    const frames: FrameEvaluation[] = (frameData || []).map((frame: any) => ({
      ...frame,
      ai_data: typeof frame.ai_data === "string" ? JSON.parse(frame.ai_data) : frame.ai_data,
    }));

    return [overall, ...frames];
  } catch (err) {
    console.error("[fetchEvaluationsForDesign] unexpected error:", err);
    return [];
  }
}