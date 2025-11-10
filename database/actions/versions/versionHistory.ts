import { createClient } from "@/utils/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type Snapshot = {
  age: string;
  occupation: string;
};
type Versions = {
  id: string;
  design_id: string;
  version: number;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  ai_summary: string;
  ai_data: string;
  created_at: string;
  snapshot: Snapshot;
  total_score?: number;
  is_hidden?: boolean;
  hidden_at?: string | null;
};

export async function fetchDesignVersions(
  designId: string
): Promise<Versions[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("design_versions")
    .select(
      `
      id, design_id,
      version,
      snapshot,
      file_key, node_id,
      thumbnail_url,
      ai_summary,
      ai_data,
      total_score,
      created_at,
      is_hidden,
      hidden_at
    `
    )
    .eq("design_id", designId)
    .order("version", { ascending: true });
  if (error) {
    console.error(error.message);
    throw error;
  }
  return data || [];
}

export async function deleteDesignVersion(versionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("design_versions")
    .update({ is_hidden: true, hidden_at: new Date().toISOString() })
    .eq("id", versionId);

  if (error) throw error;
}


export async function hideDesignVersion(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("design_versions")
    .update({ is_hidden: true, hidden_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function unhideDesignVersion(versionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("design_versions")
    .update({ is_hidden: false, hidden_at: null })
    .eq("id", versionId);

  if (error) throw error;
}

export async function getNextVersion(
  supabase: SupabaseClient,
  designId: string
): Promise<number> {
  const { data: versions, error } = await supabase
    .from("design_versions")
    .select("version")
    .eq("design_id", designId)
    .order("version", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error getting next version:", error);
    // Instead of defaulting to 1, throw the error so the caller can handle it
    throw error;
  }

  // Defensive: Ensure versions is an array and version is a number
  const latestVersion =
    Array.isArray(versions) &&
    versions.length > 0 &&
    typeof versions[0].version === "number"
      ? versions[0].version
      : 0;

  return latestVersion + 1;
}

 export async function fetchFramesForVersion(versionId: string, designId: string) {
    const supabase = createClient();

    // You can keep this query if you still need version metadata (e.g., to set evalResult),
    // but do NOT construct or return an "overall" frame.
    const { data: versionData, error: versionError } = await supabase
      .from("design_versions")
      .select(
        `
        id, design_id, version, file_key, node_id, thumbnail_url, created_by,
        ai_summary, ai_data, snapshot, created_at, updated_at, total_score
      `
      )
      .eq("design_id", designId)
      .eq("id", versionId)
      .maybeSingle();

    if (versionError) {
      console.error("Failed to fetch version:", versionError.message);
      return [];
    }
    if (!versionData) {
      console.warn("No version data for", designId, "version:", versionId);
      return [];
    }

    // Fetch all frames for this version (real frames only)
    const { data: frameData, error: frameError } = await supabase
      .from("design_frame_evaluations")
      .select(
        `
      id, design_id, version_id, file_key, node_id, thumbnail_url, owner_id,
      ai_summary, ai_data, snapshot, created_at, updated_at
    `
      )
      .eq("design_id", designId)
      .eq("version_id", versionId)
      .order("created_at", { ascending: true });

    if (frameError) {
      console.error("Failed to fetch frame evaluations:", frameError.message);
      return [];
    }

    // Parse AI data and attach originalIndex
    const safeParse = (raw: any) => {
      if (typeof raw !== "string") return raw ?? {};
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    };

    const framesOnly = (frameData || []).map((frame: any, i: number) => ({
      ...frame,
      ai_data: safeParse(frame.ai_data),
      originalIndex: i,
    }));

    return framesOnly;
  }


  