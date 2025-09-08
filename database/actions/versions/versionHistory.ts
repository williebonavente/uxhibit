import { createClient } from "@/utils/supabase/client";  

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


// Add this function to fetch all versions for a design
export async function fetchDesignVersions(designId: string): Promise<Versions[]>  {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("design_versions")
    .select(`
      id,
      design_id,
      version,
      snapshot,
      file_key,
      node_id,
      thumbnail_url,
      ai_summary,
      ai_data,
      created_at
    `)
    .eq("design_id", designId)
    .order("version", { ascending: true});
  if (error) throw error;
  return data || [];
}


export async function deleteDesignVersion(versionId: string):Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase 
  .from("design_versions")
  .delete()
  .eq("id", versionId);

  if (error) throw error;
  return true;
}