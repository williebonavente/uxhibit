import { createClient } from "@/utils/supabase/client";
import type { EvalResponse } from "@/lib/types/evalResponse";

/**
 * Fetch the latest saved evaluation for a design and return an EvalResponse or null.
 */
export async function fetchSavedEvaluationForDesign(designId?: string): Promise<EvalResponse | null> {
  if (!designId) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("design_versions")
      .select(`
        node_id,
        thumbnail_url,
        ai_summary,
        ai_data,
        total_score,
        snapshot,
        created_at
      `)
      .eq("design_id", designId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.error("[fetchSavedEvaluationForDesign] fetch error:", error);
      return null;
    }

    // parse ai_data and snapshot safely
    let parsedAiData: any = null;
    if (data.ai_data) {
      try {
        parsedAiData = typeof data.ai_data === "string" ? JSON.parse(data.ai_data) : data.ai_data;
      } catch (err) {
        console.error("[fetchSavedEvaluationForDesign] parse ai_data failed:", err, data.ai_data);
        parsedAiData = null;
      }
    }

    let parsedSnapshot: any = null;
    if (data.snapshot) {
      try {
        parsedSnapshot = typeof data.snapshot === "string" ? JSON.parse(data.snapshot) : data.snapshot;
      } catch (err) {
        console.error("[fetchSavedEvaluationForDesign] parse snapshot failed:", err, data.snapshot);
        parsedSnapshot = null;
      }
    }

    if (!parsedAiData) return null;

    const mapped: EvalResponse = {
      nodeId: data.node_id,
      imageUrl: data.thumbnail_url,
      summary: data.ai_summary ?? parsedAiData.summary ?? parsedAiData.ai?.summary ?? "",
      heuristics: parsedAiData.heuristics ?? parsedAiData.ai?.heuristics ?? null,
      ai_status: "ok",
      strengths: Array.isArray(parsedAiData.strengths) ? parsedAiData.strengths : parsedAiData.ai?.strengths ?? [],
      weaknesses: Array.isArray(parsedAiData.weaknesses) ? parsedAiData.weaknesses : parsedAiData.ai?.weaknesses ?? [],
      issues: Array.isArray(parsedAiData.issues) ? parsedAiData.issues : parsedAiData.ai?.issues ?? [],
      category_scores: parsedAiData.category_scores ?? parsedAiData.ai?.category_scores ?? null,
      ai: parsedAiData.ai ?? parsedAiData,
      overall_score:
        parsedAiData.overall_score ??
        parsedAiData.ai?.overall_score ??
        data.total_score ??
        null,
    };

    return mapped;
  } catch (err) {
    console.error("[fetchSavedEvaluationForDesign] unexpected error:", err);
    return null;
  }
}