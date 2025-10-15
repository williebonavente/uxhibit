import { SupabaseClient } from "@supabase/supabase-js";

type SaveDesignVersionParams = {
  supabase: SupabaseClient;
  designId: string;
  fileKey: string;
  nodeId: string;
  thumbnailUrl?: string;
  fallbackImageUrl?: string;
  summary: string;
  frameResults: any[];
  total_score: number;
  snapshot?: any;
  user?: { id: string };
};

export async function saveDesignVersion({
  supabase,
  versionId,
  designId,
  fileKey,
  nodeId,
  thumbnailUrl,
  fallbackImageUrl,
  summary,
  frameResults,
  total_score,
  snapshot,
  user,
}: SaveDesignVersionParams & { versionId?: string }) {
  try {
    if (
      !fileKey ||
      typeof fileKey !== "string" ||
      !nodeId ||
      typeof nodeId !== "string" ||
      !(thumbnailUrl || fallbackImageUrl) ||
      !summary ||
      typeof summary !== "string" ||
      !frameResults ||
      !Array.isArray(frameResults) ||
      frameResults.length === 0 ||
      typeof total_score !== "number" ||
      !user?.id ||
      !snapshot
    ) {
      console.error("Aborting save: Missing or invalid required fields.", {
        fileKey, nodeId, thumbnailUrl, summary, frameResults, total_score, snapshot, user
      });
      return { error: "Missing or invalid required fields." };
    }

    let actualVersionId = versionId;

    // If no versionId, create a new version record (first time)
    if (!actualVersionId) {
      const { data: versionInsert, error: versionInsertError } = await supabase
        .from("design_versions")
        .insert({
          design_id: designId,
          file_key: fileKey,
          node_id: nodeId,
          thumbnail_url: thumbnailUrl || fallbackImageUrl,
          status: "pending",
          created_by: user?.id,
          created_at: new Date().toISOString(),
          version: 1 // or use your getNextVersion logic if needed
        })
        .select("id")
        .single();

      if (versionInsertError || !versionInsert) {
        console.error("Failed to create initial version:", versionInsertError);
        return { error: versionInsertError };
      }
      actualVersionId = versionInsert.id;
    }

    // Update the version record with evaluation results
    await supabase.from("design_versions")
      .update({
        ai_summary: summary,
        ai_data: frameResults,
        total_score,
        thumbnail_url: thumbnailUrl || fallbackImageUrl,
        snapshot: typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", actualVersionId);

    // Insert frame evaluations
    for (const frame of frameResults) {
      const { error: frameError } = await supabase
        .from("design_frame_evaluations")
        .insert({
          design_id: designId,
          version_id: actualVersionId,
          file_key: fileKey,
          node_id: frame.node_id,
          thumbnail_url: frame.thumbnail_url,
          ai_summary: frame.ai?.summary || null,
          ai_data: frame.ai,
          ai_error: frame.ai_error,
          created_at: new Date().toISOString(),
          snapshot: typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot,
          owner_id: user?.id
        });
      if (frameError) {
        console.error("Error inserting frame evaluation:", frameError);
      }
    }

    console.log("[saveDesignVersion] Updated version to completed:", {
      versionId: actualVersionId,
      ai_summary: summary,
      total_score,
      frameResultsCount: frameResults.length,
      status: "completed"
    });

    return { versionId: actualVersionId };
  } catch (err) {
    console.error("Error in Supabase save (aggregate):", err);
    return { error: err };
  }
}