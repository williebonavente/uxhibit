import { SupabaseClient } from "@supabase/supabase-js";

type SaveDesignVersionParams = {
  supabase: SupabaseClient;
  designId: string;
  fileKey?: string | null;
  nodeId?: string | null;
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
    // Relaxed validation: allow missing fileKey/nodeId/snapshot for file uploads
    if (
      !(thumbnailUrl || fallbackImageUrl) ||
      !summary ||
      typeof summary !== "string" ||
      !Array.isArray(frameResults) ||
      frameResults.length === 0 ||
      typeof total_score !== "number" ||
      !user?.id
    ) {
      console.error("Aborting save: Missing or invalid required fields.", {
        fileKey,
        nodeId,
        thumbnailUrl,
        fallbackImageUrl,
        summary,
        frameResultsLen: Array.isArray(frameResults) ? frameResults.length : "n/a",
        total_score,
        snapshotPresent: Boolean(snapshot),
        user,
      });
      return { error: "Missing or invalid required fields." };
    }

    let actualVersionId = versionId;

    // Create version if needed
    if (!actualVersionId) {
      const { data: versionInsert, error: versionInsertError } = await supabase
        .from("design_versions")
        .insert({
          design_id: designId,
          file_key: fileKey ?? null,
          node_id: nodeId ?? null,
          thumbnail_url: thumbnailUrl || fallbackImageUrl,
          status: "pending",
          created_by: user.id,
          created_at: new Date().toISOString(),
          version: 1,
        })
        .select("id")
        .single();

      if (versionInsertError || !versionInsert) {
        console.error("Failed to create initial version:", versionInsertError);
        return { error: versionInsertError };
      }
      actualVersionId = versionInsert.id;
    }

    // Update version with evaluation result
    await supabase
      .from("design_versions")
      .update({
        ai_summary: summary,
        ai_data: frameResults,
        total_score,
        thumbnail_url: thumbnailUrl || fallbackImageUrl,
        snapshot: typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot ?? null,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", actualVersionId);

    // Insert per-frame evaluations (defensive fallbacks)
    for (const frame of frameResults) {
      const safeNodeId =
        frame?.node_id ?? frame?.frame_id ?? frame?.id ?? nodeId ?? null;
      const safeThumb =
        frame?.thumbnail_url ?? frame?.image_url ?? frame?.url ?? thumbnailUrl ?? fallbackImageUrl ?? null;

      const { error: frameError } = await supabase.from("design_frame_evaluations").insert({
        design_id: designId,
        version_id: actualVersionId,
        file_key: fileKey ?? null,
        node_id: safeNodeId,
        thumbnail_url: safeThumb,
        ai_summary: frame?.ai?.summary ?? null,
        ai_data: frame?.ai ?? null,
        ai_error: frame?.ai_error ?? null,
        created_at: new Date().toISOString(),
        snapshot: typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot ?? null,
        owner_id: user.id,
      });

      if (frameError) {
        console.error("Error inserting frame evaluation:", frameError, { frame });
      }
    }

    console.log("[saveDesignVersion] Updated version to completed:", {
      versionId: actualVersionId,
      ai_summary: summary,
      total_score,
      frameResultsCount: frameResults.length,
      status: "completed",
    });

    return { versionId: actualVersionId };
  } catch (err) {
    console.error("Error in Supabase save (aggregate):", err);
    return { error: err };
  }
}