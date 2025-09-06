import { createClient } from "@/utils/supabase/client";  

// Define the Versions type to match the structure returned from Supabase
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