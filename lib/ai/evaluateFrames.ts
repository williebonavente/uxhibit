import { AiEvaluator, aiEvaluator } from "@/lib/ai/aiEvaluator";
import { getHeuristicScores } from "../uxStandards/heuristicMapping";

export async function evaluateFrames({
  frameIds,
  frameImages,
  user,
  designId,
  versionId,
  fileKey,
  snapshot,
  authError,
  supabase,
  figmaFileUrl,
}: {
  frameIds: string[],
  frameImages: Record<string, string>,
  user: any,
  designId: string,
  fileKey: string,
  versionId?: string,
  snapshot?: any,
  authError?: any,
  supabase: any,
  figmaFileUrl: string,
}) {
  const frameSupabaseUrls: Record<string, string> = {};

  await Promise.all(
    Object.entries(frameImages).map(async ([frameId, figmaUrl]) => {
      let supabaseUrl: string | null = null;
      try {
        // Add scale param for thumbnail
        const thumbnailUrl = figmaUrl.includes('?') ? `${figmaUrl}&scale=0.3` : `${figmaUrl}?scale=0.3`;
        const imgRes = await fetch(thumbnailUrl);
        if (!imgRes.ok) {
          frameSupabaseUrls[frameId] = figmaUrl;
          return;
        }
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const filePath = `${user?.id}/${designId}/${frameId}.png`;
        const { error } = await supabase.storage
          .from('figma-frames')
          .upload(filePath, imgBuffer, {
            contentType: 'image/png',
            upsert: true,
          });
        if (!error) {
          const { data: signedData } = await supabase.storage
            .from('figma-frames')
            .createSignedUrl(filePath, 60 * 60 * 24 * 365);
          supabaseUrl = signedData?.signedUrl || figmaUrl;
        } else {
          supabaseUrl = figmaUrl;
        }
      } catch {
        supabaseUrl = figmaUrl;
      }
      frameSupabaseUrls[frameId] = supabaseUrl || figmaUrl;
    })
  );


  if (authError || !user) {
    throw new Error('Unauthorized - user not found');
  }
  // Instead of using an image URL:
  figmaFileUrl = figmaFileUrl;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/figma/parse?url=${encodeURIComponent(figmaFileUrl)}`);
  const figmaContext = await res.json();
  console.log(figmaContext);
  const heuristics = getHeuristicScores(figmaContext);

  const frameResults: any[] = await Promise.all(
    frameIds.map(async (nodeId, index) => {
      const imageUrl = frameSupabaseUrls[nodeId] || frameImages[nodeId];
      let ai: AiEvaluator | null = null;
      let ai_error: string | undefined;

      try {
        ai = await aiEvaluator(imageUrl, heuristics, {}, snapshot);
        console.log("I am just adding the console.log to check the snapshot: ", snapshot)
        if (!ai) ai_error = "mistral_skipped_or_empty";
        if (ai && Array.isArray(ai.issues)) {
          ai.issues = ai.issues.map((issue, issueIdx) => ({
            ...issue,
            id: `frame${index + 1}-issue${issueIdx}`,
          }));
        }
      } catch (e: unknown) {
        ai_error = `mistral_error: ${e instanceof Error ? e.message : "unknown"}`;
      }

      if (ai && nodeId) {
        try {
          await supabase.from("design_frame_evaluations").upsert({
            design_id: designId,
            file_key: fileKey,
            node_id: nodeId,
            version_id: versionId ?? null,
            thumbnail_url: imageUrl,
            ai_summary: ai.summary || null,
            ai_data: ai,
            snapshot: (() => {
              if (!snapshot) return null;
              if (typeof snapshot === "string") {
                try { return JSON.parse(snapshot); } catch { return null; }
              }
              return snapshot;
            })(),
            created_at: new Date().toISOString(),
            owner_id: user.id
          },
            { onConflict: ['design_id', 'node_id'] }
          );
        } catch (err) {
          console.log(err);
          throw err;
        }
      }
      return {
        node_id: nodeId,
        thumbnail_url: imageUrl,
        ai,
        ai_error,
      };
    })
  );
  // Aggregate results

  const validResults = frameResults.filter(r => r.ai);
  const total_score = validResults.length
    ? Math.round(validResults.reduce((sum, r) => sum + (r.ai?.overall_score ?? 0), 0) / validResults.length)
    : 0;
  const summary = `Aggregate summary: ${validResults.map(r => r.ai?.summary).join(" | ")}`;

  // Assign a jobId, e.g., using designId and versionId for uniqueness
  const jobId = `${designId}-${versionId ?? "latest"}`;

  return {
    jobId,
    frameResults,
    validResults,
    total_score,
    summary,
  };
}