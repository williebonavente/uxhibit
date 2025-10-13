import { AiEvaluator, aiEvaluator } from "@/lib/ai/aiEvaluator";
import { getHeuristicScores } from "../uxStandards/heuristicMapping";
import { AuthError, SupabaseClient, User } from "@supabase/supabase-js";

export type PersonaSnapshot = {
  age?: string,
  occupation?: string;
}

export interface EvaluateFramesReturn {
  frameResults: FrameResult[];
  validResults: FrameResult[];
  total_score: number;
  summary: string;
  jobId: string;
}

export type EvaluateFramesOptions = {
  frameIds: string[];
  frameImages: Record<string, string>;
  figmaFileUrl: string,
  user: User | null;
  designId: string;
  fileKey: string;
  snapshot?: PersonaSnapshot;
  authError?: AuthError | null;
  supabase: SupabaseClient;
  sleep?: (ms: number) => Promise<void>;
}

export interface FrameResult {
  node_id: string;
  thumbnail_url: string;
  ai: AiEvaluator | null;
  ai_error?: string;
}

export async function evaluateFrames(options: EvaluateFramesOptions & { jobId?: string })
  : Promise<EvaluateFramesReturn> {
  const {
    frameIds,
    frameImages,
    user,
    designId,
    fileKey,
    snapshot,
    authError,
    supabase,
    sleep = (ms: number) => new Promise(res => setTimeout(res, ms)),
  } = options;
  
  const jobId = options.jobId ?? "";
  async function saveProgress(jobId: string, progress: number, supabase: SupabaseClient) {
    await supabase
      .from("frame_evaluation_progress")
      .upsert({ job_id: jobId, progress });
  }
  const frameSupabaseUrls: Record<string, string> = {};

  for (const [frameId, figmaUrl] of Object.entries(frameImages) as [string, string][]) {
    let supabaseUrl: string | null = null;
    try {
      const imgRes = await fetch(figmaUrl);
      if (!imgRes.ok) {
        frameSupabaseUrls[frameId] = figmaUrl;
        continue;
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
  }

  if (authError || !user) {
    throw new Error('Unauthorized - user not found');
  }
  // Instead of using an image URL:
  const figmaFileUrl = options.figmaFileUrl; // Make sure this is passed in EvaluateFramesOptions

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/figma/parse?url=${encodeURIComponent(figmaFileUrl)}`);
  const figmaContext = await res.json();
  console.log(figmaContext);
  const heuristics = getHeuristicScores(figmaContext);

  const frameResults: FrameResult[] = [];
  for (const [index, nodeId] of frameIds.entries()) {
    const imageUrl = frameSupabaseUrls[nodeId] || frameImages[nodeId];
    let aiEvaluation: AiEvaluator | null = null;
    let ai_error: string | undefined;

    const progress = Math.round(((index + 1) / frameIds.length) * 100);

    try {
      const limitedAccessibilityResults = Array.isArray(figmaContext.accessibilityResults)
        ? figmaContext.accessibilityResults.slice(0, 5)
        : figmaContext.accessibilityResults;

      const limitedLayoutResults = Array.isArray(figmaContext.layoutResults)
        ? figmaContext.layoutResults.slice(0, 5)
        : figmaContext.layoutResults;

      const limitedTextNodes = Array.isArray(figmaContext.textNodes)
        ? figmaContext.textNodes.slice(0, 10)
        : figmaContext.textNodes;

      aiEvaluation = await aiEvaluator(
        imageUrl,
        heuristics,
        {
          accessibilityResults: limitedAccessibilityResults,
          layoutResults: limitedLayoutResults,
          textNodes: limitedTextNodes,
          persona: {
            generation: snapshot?.age,
            occupation: snapshot?.occupation,
          }
        }
      );

      if (!aiEvaluation) ai_error = "mistral_skipped_or_empty";
      if (aiEvaluation && Array.isArray(aiEvaluation.issues)) {
        aiEvaluation.issues = aiEvaluation.issues.map((issue, issueIdx) => ({
          ...issue,
          id: `frame${index + 1}-issue${issueIdx}`,
        }));
      }
    } catch (e: unknown) {
      ai_error = `mistral_error: ${e instanceof Error ? e.message : "unknown"}`;
    }

    if (aiEvaluation) {
      try {
        await supabase.from("design_frame_evaluations").upsert({
          design_id: designId,
          file_key: fileKey,
          node_id: nodeId,
          thumbnail_url: imageUrl,
          ai_summary: aiEvaluation.summary || null,
          ai_data: aiEvaluation,
          snapshot: (() => {
            if (!snapshot) return null;
            if (typeof snapshot === "string") {
              try { return JSON.parse(snapshot); } catch { return null; }
            }
            return snapshot;
          })(),
          created_at: new Date().toISOString(),
          owner_id: user.id
        });
      } catch (err) {
        console.log(err);
        throw err
      }
    }

    frameResults.push({
      node_id: nodeId,
      thumbnail_url: imageUrl,
      ai: aiEvaluation,
      ai_error,
    });

    if (options.jobId) {
      await saveProgress(options.jobId, progress, supabase);
    }
    await sleep(1000);
  }

  // Aggregate results
  const validResults = frameResults.filter(r => r.ai);
  const total_score = validResults.length
    ? Math.round(validResults.reduce((sum, r) => sum + (r.ai?.overall_score ?? 0), 0) / validResults.length)
    : 0;
  const summary = `Aggregate summary: ${validResults.map(r => r.ai?.summary).join(" | ")}`;

  return {
    jobId,
    frameResults,
    validResults,
    total_score,
    summary,
  };
}