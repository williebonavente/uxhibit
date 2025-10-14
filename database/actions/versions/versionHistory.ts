import { createClient } from "@/utils/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";


type Snapshot = {
  age: string;
  occupation: string;
}
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
};


export async function fetchDesignVersions(designId: string): Promise<Versions[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("design_versions")
    .select(`
      id, design_id, 
      version,
      snapshot,
      file_key,node_id,
      thumbnail_url,
      ai_summary,
      ai_data,
      total_score,
      created_at`
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
    .delete()
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
    Array.isArray(versions) && versions.length > 0 && typeof versions[0].version === "number"
      ? versions[0].version
      : 0;

  return latestVersion + 1;
}