import { getNextVersion } from "@/database/actions/versions/versionHistory";

type SaveDesignVersionParams = {
  supabase: any;
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
}: SaveDesignVersionParams) {
  try {
    const nextVersion = await getNextVersion(supabase, designId);
    const upsertPayload = {
      design_id: designId,
      file_key: fileKey,
      node_id: nodeId,
      thumbnail_url: thumbnailUrl || fallbackImageUrl,
      ai_summary: summary,
      ai_data: frameResults,
      total_score,
      snapshot: (() => {
        if (!snapshot) return null;
        if (typeof snapshot === "string") {
          try { return JSON.parse(snapshot); } catch { return null; }
        }
        return snapshot;
      })(),
      created_at: new Date().toISOString(),
      version: nextVersion,
      created_by: user?.id
    };
    const { data } = await supabase.from("design_versions")
      .insert(upsertPayload)
      .select();

    const { data: versionRows, error: versionError } = await supabase
      .from("design_versions")
      .select("id")
      .eq("design_id", designId)
      .eq("version", nextVersion)
      .maybeSingle();

    if (versionError || !versionRows) {
      console.error("Failed to fetch new version id:", versionError);
      return { error: versionError };
    } else {
      const versionId = versionRows.id;
      for (const frame of frameResults) {
        const { error: frameError } = await supabase
          .from("design_frame_evaluations")
          .insert({
            design_id: designId,
            version_id: versionId,
            file_key: fileKey,
            node_id: frame.node_id,
            thumbnail_url: frame.thumbnail_url,
            ai_summary: frame.ai?.summary || null,
            ai_data: frame.ai,
            ai_error: frame.ai_error,
            created_at: new Date().toISOString(),
            snapshot: (() => {
              if (!snapshot) return null;
              if (typeof snapshot === "string") {
                try { return JSON.parse(snapshot); } catch { return null; }
              }
              return snapshot;
            })(),
            owner_id: user?.id
          });
        if (frameError) {
          console.error("Error inserting frame evaluation:", frameError);
        }
      }
      return { versionId, data };
    }
  } catch (err) {
    console.error("Error in Supabase save (aggregate):", err);
    return { error: err };
  }
}