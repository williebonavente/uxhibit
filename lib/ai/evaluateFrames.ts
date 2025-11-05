import { AiEvaluator, aiEvaluator } from "@/lib/ai/aiEvaluator";
import { getHeuristicScores } from "../uxStandards/heuristicMapping";
import Sentiment from "sentiment";

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
  onProgress,
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
  onProgress?: (current: number, total: number) => Promise<void>,
}) {
  const frameSupabaseUrls: Record<string, string> = {};

  function preprocessTextNodes(nodes: any[]) {
    if (!nodes || nodes.length === 0) return [];

    return nodes.map(node => ({
      text: node.text.length > 40 ? node.text.slice(0, 40) + "..." : node.text,
      fontSize: node.fontSize,
      fontWeight: node.fontWeight,
      color: node.color,
      x: Math.round(node.boundingBox.x),
      y: Math.round(node.boundingBox.y),
      width: Math.round(node.boundingBox.width),
      height: Math.round(node.boundingBox.height),
    }));
  }

  function summarizeFrameForAI(frameId: string, nodes: any[]) {
    const count = nodes.length;
    const fontSizes = nodes.map(n => n.fontSize);
    const avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / (fontSizes.length || 1);

    return {
      frame_id: frameId,
      total_text_elements: count,
      avg_font_size: Math.round(avgFontSize),
      unique_fonts: [...new Set(nodes.map(n => n.fontFamily))],
      sample_texts: nodes.slice(0, 5).map(n => n.text),
    };
  }

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
  figmaFileUrl = figmaFileUrl;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/figma/parse?url=${encodeURIComponent(figmaFileUrl)}`);
  const figmaContext = await res.json();
  const heuristics = getHeuristicScores(figmaContext);
  const accessibilityResults = figmaContext.accessibilityResults;
  const layoutResults = figmaContext.layoutResults;
  const textNodes = figmaContext.textNodes;
  const detectedButtons = figmaContext.detectedButtons;

  console.log(figmaContext);
  console.log("Detected Buttons COMING FROM FIGMA CONTEXT: ", detectedButtons);

  const minimalAccessibilityResults = accessibilityResults.map(result => ({
    frameId: result.frameId,
    frameName: result.frameName,
    layoutScore: result.layoutScore,
    averageContrastScore: result.averageContrastScore,
  }));

  const minimalLayoutResults = Object.entries(layoutResults).map(([frameId, result]) => ({
    frameId,
    score: result.score,
    summary: result.summary,
    // issues: result.issues,
  }));


  const frameResults: any[] = await Promise.all(
    frameIds.map(async (nodeId, index) => {
      const imageUrl = frameSupabaseUrls[nodeId] || frameImages[nodeId];
      const frameTextNodesRaw = textNodes[nodeId] || [];
      const frameTextNodes = preprocessTextNodes(frameTextNodesRaw);
      const textSummary = summarizeFrameForAI(nodeId, frameTextNodesRaw);

      let ai: AiEvaluator | null = null;
      let ai_error: string | undefined;

      console.log("RETURNING FIGMA CONTEXT: ");
      console.log(figmaContext.accessibilityResults)
      try {
        // TODO: FOR RE-EVALUATION
                // Ensure snapshot is an object and contains iteration
        const snapshotObj =
          typeof snapshot === "string"
            ? (() => { try { return JSON.parse(snapshot); } catch { return undefined; } })()
            : snapshot;
        console.log("Evaluator snapshot.iteration:", snapshotObj?.iteration);

        ai = await aiEvaluator(
          imageUrl,
          heuristics,
          {
            accessibilityResults: minimalAccessibilityResults,
            layoutResults: minimalLayoutResults,
            textNodes: frameTextNodes,
            textSummary,
            normalizedFrames: figmaContext.normalizedFrames,
          },
          snapshotObj
        );
 

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

      if (onProgress) {
        await onProgress(index + 1, frameIds.length);
      }
      return {
        node_id: nodeId,
        thumbnail_url: imageUrl,
        ai,
        ai_error,
      };
    })
  );
  const validResults = frameResults.filter(r => r.ai);
  const total_score = validResults.length
    ? Math.round(validResults.reduce((sum, r) => sum + (r.ai?.overall_score ?? 0), 0) / validResults.length)
    : 0;

  const mergedSummaries = validResults
    .map(r => String(r.ai?.summary ?? ""))
    .filter(Boolean)
    .join(". ");

  function makeThreeSentenceSummary(text: string, count = 3): string {
    if (!text) return "";
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (sentences.length === 0) return "";
    if (sentences.length <= count) {
      if (sentences.length < count) {
        const clauses = sentences[0].split(",").map(c => c.trim()).filter(Boolean);
        if (clauses.length >= count) {
          return clauses.slice(0, count).map(c => (c.endsWith(".") ? c : c + ".")).join(" ");
        }
      }
      return sentences.join(" ");
    }

    // build word frequency map for scoring
    const tokens = (text.toLowerCase().match(/\w+/g) || []);
    const freq: Record<string, number> = {};
    tokens.forEach(w => (freq[w] = (freq[w] || 0) + 1));

    const scored = sentences.map(s => {
      const words = (s.toLowerCase().match(/\w+/g) || []);
      const score = words.reduce((sum, w) => sum + (freq[w] || 0), 0) / Math.sqrt(Math.max(1, words.length));
      return { s, score };
    });

    // pick top N sentences
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, count).map(x => x.s);

    // preserve original order
    const ordered = sentences.filter(s => top.includes(s)).slice(0, count);
    return ordered.join(" ");
  }

  // sentiment (lightweight) — Sentiment is already imported at top of file
  const sentimentAnalyzer = new Sentiment();
  const sentimentResult = mergedSummaries ? sentimentAnalyzer.analyze(mergedSummaries) : { score: 0, comparative: 0 };
  const sentimentLabel = sentimentResult.score > 0 ? "positive" : sentimentResult.score < 0 ? "negative" : "neutral";

  const threeSentenceSummary = makeThreeSentenceSummary(mergedSummaries, 3);
  const summary = threeSentenceSummary;
  const long_summary = mergedSummaries;


  const jobId = `${designId}-${versionId ?? "latest"}`;
  // console.log("[JobId]:", jobId);
  return {
    jobId,
    frameResults,
    validResults,
    total_score,
    summary,
    long_summary,
    sentiment: {
      score: sentimentResult.score,
      comparative: sentimentResult.comparative,
      label: sentimentLabel,
    }
  };
}