import { createClient } from "@/utils/supabase/client";
import type { Design } from "@/lib/types/designTypes";

/**
 * Fetch design + published record + latest version frames and return normalized Design or null.
 */
export async function fetchNormalizedDesign(designId?: string): Promise<Design | null> {
  if (!designId) return null;
  try {
    const supabase = createClient();

    const { data: designData, error: designError } = await supabase
      .from("designs")
      .select(`
        id, title, figma_link, file_key,
        node_id, thumbnail_url,
        current_version_id, owner_id,
        design_versions (
          id, file_key, node_id, thumbnail_url, total_score,
          ai_summary, ai_data, snapshot, created_at, version
        )
      `)
      .eq("id", designId)
      .maybeSingle();

    if (designError || !designData) {
      console.error("[fetchNormalizedDesign] failed to load design:", designError, designData);
      return null;
    }

    const { data: publishedData } = await supabase
      .from("published_designs")
      .select(`is_active, published_version_id, published_at`)
      .eq("design_id", designId)
      .eq("is_active", true)
      .maybeSingle();

    const latestVersion = designData.design_versions?.[0];

    let frames: any[] = [];
    const latestVersionId = latestVersion?.id;
    if (latestVersionId) {
      const { data: frameData, error: frameError } = await supabase
        .from("design_frame_evaluations")
        .select(`
          id, design_id, version_id, file_key, node_id, thumbnail_url, owner_id,
          ai_summary, ai_data, snapshot, created_at, updated_at
        `)
        .eq("design_id", designData.id)
        .eq("version_id", latestVersionId)
        .order("created_at", { ascending: true });

      if (frameError) {
        console.error("[fetchNormalizedDesign] failed to fetch frame evaluations:", frameError);
      } else {
        frames = (frameData || []).map((frame: any) => ({
          id: frame.node_id,
          name: frame.ai_summary || frame.node_id,
          ...frame,
          ai_data: typeof frame.ai_data === "string" ? JSON.parse(frame.ai_data) : frame.ai_data,
        }));
      }
    }

    const normalized: Design = {
      id: designData.id,
      project_name: designData.title,
      fileKey: latestVersion?.file_key || designData.file_key || undefined,
      nodeId: latestVersion?.node_id || designData.node_id || undefined,
      imageUrl: designData.thumbnail_url || "/images/design-thumbnail.png",
      thumbnail: designData.thumbnail_url || undefined,
      snapshot: latestVersion?.snapshot || null,
      current_version_id: designData.current_version_id,
      is_active: publishedData?.is_active ?? false,
      published_version_id: publishedData?.published_version_id ?? "",
      published_at: publishedData?.published_at ?? "",
      figma_link: designData.figma_link || "",
      owner_id: designData.owner_id,
      frames,
    };

    return normalized;
  } catch (err) {
    console.error("[fetchNormalizedDesign] unexpected error:", err);
    return null;
  }
}