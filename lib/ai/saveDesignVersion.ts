import { SupabaseClient } from "@supabase/supabase-js";

type SaveDesignVersionParams = {
  supabase: SupabaseClient;
  designId: string;
  fileKey?: string | null;
  nodeId?: string | null;
  thumbnailUrl?: string;
  fallbackImageUrl?: string;
  summary?: string | null;
  frameResults?: any[];
  total_score?: number | null;
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
    const now = new Date().toISOString();

    // Normalize optional params
    const hasResults =
      typeof summary === "string" &&
      Array.isArray(frameResults) &&
      frameResults.length > 0 &&
      typeof total_score === "number";

    const thumb = thumbnailUrl || fallbackImageUrl || null;

    // 1) Ensure version row exists (even when versionId is provided)
    let actualVersionId = versionId?.trim() || undefined;

    // If a versionId is provided, verify it exists; else create with that id
    if (actualVersionId) {
      const { data: existing, error: checkErr } = await supabase
        .from("design_versions")
        .select("id")
        .eq("id", actualVersionId)
        .maybeSingle();

      if (checkErr) {
        console.error("[saveDesignVersion] Version check error:", checkErr);
        return { error: checkErr };
      }

      if (!existing) {
        // Insert minimal pending version using provided id
        const { error: insertErr } = await supabase.from("design_versions").insert({
          id: actualVersionId,
          design_id: designId,
          file_key: fileKey ?? null,
          node_id: nodeId ?? null,
          thumbnail_url: thumb,
          status: "pending",
          created_by: user?.id ?? null,
          created_at: now,
          updated_at: now,
          version: 1,
        });
        if (insertErr) {
          console.error("[saveDesignVersion] Failed to create version with provided id:", insertErr);
          return { error: insertErr };
        }
      } else {
        // Optionally patch thumbnail if missing
        if (thumb) {
          await supabase
            .from("design_versions")
            .update({ thumbnail_url: thumb, updated_at: now })
            .eq("id", actualVersionId);
        }
      }
    } else {
      // No versionId provided: create one
      const { data: versionInsert, error: versionInsertError } = await supabase
        .from("design_versions")
        .insert({
          design_id: designId,
          file_key: fileKey ?? null,
          node_id: nodeId ?? null,
          thumbnail_url: thumb,
          status: "pending",
          created_by: user?.id ?? null,
          created_at: now,
          updated_at: now,
          version: 1,
        })
        .select("id")
        .single();

      if (versionInsertError || !versionInsert) {
        console.error("[saveDesignVersion] Failed to create initial version:", versionInsertError);
        return { error: versionInsertError };
      }
      actualVersionId = versionInsert.id;
    }

    // 2) If no results yet, we’re done (bootstrap path to satisfy FK constraints)
    if (!hasResults) {
      return { versionId: actualVersionId! };
    }

    // 3) Update version with evaluation result
    await supabase
      .from("design_versions")
      .update({
        ai_summary: summary!,
        ai_data: frameResults!,
        total_score: total_score!,
        thumbnail_url: thumb,
        snapshot: typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot ?? null,
        status: "completed",
        updated_at: now,
      })
      .eq("id", actualVersionId!);

    // 4) Insert per-frame evaluations
    for (const frame of frameResults!) {
      const safeNodeId =
        frame?.node_id ?? frame?.frame_id ?? frame?.id ?? nodeId ?? null;
      const safeThumb =
        frame?.thumbnail_url ?? frame?.image_url ?? frame?.url ?? thumb ?? null;

      const { error: frameError } = await supabase
        .from("design_frame_evaluations")
        .insert({
          design_id: designId,
          version_id: actualVersionId!,
          file_key: fileKey ?? null,
          node_id: safeNodeId,
          thumbnail_url: safeThumb,
          ai_summary: frame?.ai?.summary ?? null,
          ai_data: frame?.ai ?? null,
          ai_error: frame?.ai_error ?? null,
          created_at: now,
          snapshot: typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot ?? null,
          owner_id: user?.id ?? null,
        });

      if (frameError) {
        console.error("Error inserting frame evaluation:", frameError, { frame });
      }
    }

    console.log("[saveDesignVersion] Version completed:", {
      versionId: actualVersionId,
      total_score,
      frames: frameResults!.length,
    });

    return { versionId: actualVersionId! };
  } catch (err) {
    console.error("Error in saveDesignVersion:", err);
    return { error: err };
  }
}