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
  frameIds: string[];
  frameImages: Record<string, string>;
  user: any;
  designId: string;
  fileKey: string;
  versionId?: string;
  snapshot?: any;
  authError?: any;
  supabase: any;
  figmaFileUrl: string;
  onProgress?: (current: number, total: number) => Promise<void>;
}) {
  const frameSupabaseUrls: Record<string, string> = {};

  function preprocessTextNodes(nodes: any[]) {
    if (!nodes || nodes.length === 0) return [];

    return nodes.map((node) => ({
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
    const fontSizes = nodes.map((n) => n.fontSize);
    const avgFontSize =
      fontSizes.reduce((a, b) => a + b, 0) / (fontSizes.length || 1);

    return {
      frame_id: frameId,
      total_text_elements: count,
      avg_font_size: Math.round(avgFontSize),
      unique_fonts: [...new Set(nodes.map((n) => n.fontFamily))],
      sample_texts: nodes.slice(0, 5).map((n) => n.text),
    };
  }

  await Promise.all(
    Object.entries(frameImages).map(async ([frameId, figmaUrl]) => {
      let supabaseUrl: string | null = null;
      try {
        // Add scale param for thumbnail
        const thumbnailUrl = figmaUrl.includes("?")
          ? `${figmaUrl}&scale=0.3`
          : `${figmaUrl}?scale=0.3`;
        const imgRes = await fetch(thumbnailUrl);
        if (!imgRes.ok) {
          frameSupabaseUrls[frameId] = figmaUrl;
          return;
        }
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const filePath = `${user?.id}/${designId}/${frameId}.png`;
        const { error } = await supabase.storage
          .from("figma-frames")
          .upload(filePath, imgBuffer, {
            contentType: "image/png",
            upsert: true,
          });
        if (!error) {
          const { data: signedData } = await supabase.storage
            .from("figma-frames")
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
    throw new Error("Unauthorized - user not found");
  }
  figmaFileUrl = figmaFileUrl;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/api/figma/parse?url=${encodeURIComponent(figmaFileUrl)}`
  );


    if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Figma parse failed: ${err?.error || res.statusText} (code: ${err?.code || res.status})`
    );
  }


  const figmaContext = await res.json();

    const heuristics = getHeuristicScores(figmaContext);

  // Safe defaults
  const accessibilityResults = Array.isArray(figmaContext.accessibilityResults)
    ? figmaContext.accessibilityResults
    : [];
  const layoutResults =
    figmaContext && typeof figmaContext.layoutResults === "object"
      ? figmaContext.layoutResults
      : {};
  const textNodes =
    figmaContext && typeof figmaContext.textNodes === "object"
      ? figmaContext.textNodes
      : {};
  const detectedButtons = Array.isArray(figmaContext.detectedButtons)
    ? figmaContext.detectedButtons
    : [];

  console.log(figmaContext);
  console.log("Detected Buttons COMING FROM FIGMA CONTEXT: ", detectedButtons);

  const accessibilityArray = accessibilityResults;
  const minimalAccessibilityResults = accessibilityArray.map((result) => ({
    frameId: result.frameId,
    frameName: result.frameName,
    layoutScore: result.layoutScore,
    layoutIssues: result.layoutIssues,
    layoutSummary: result.layoutSummary,
    contrastScore: result.contrastScore,
    textCount: result.textCount,
  }));

  const minimalLayoutResults = Object.entries(layoutResults).map(
    ([frameId, result]: [string, any]) => ({
      frameId,
      score: result?.score ?? 0,
      summary: result?.summary ?? "",
      // issues: result?.issues ?? []
    })
  );

  const frameResults: any[] = await Promise.all(
    frameIds.map(async (nodeId, index) => {
      const imageUrl = frameSupabaseUrls[nodeId] || frameImages[nodeId];
      const frameTextNodesRaw = textNodes[nodeId] || [];
      const frameTextNodes = preprocessTextNodes(frameTextNodesRaw);
      const textSummary = summarizeFrameForAI(nodeId, frameTextNodesRaw);

      let ai: AiEvaluator | null = null;
      let ai_error: string | undefined;

      console.log("RETURNING FIGMA CONTEXT: ");
      console.log(figmaContext.accessibilityResults);
      try {
        // TODO: FOR RE-EVALUATION
        // Ensure snapshot is an object and contains iteration
        const snapshotObj =
          typeof snapshot === "string"
            ? (() => {
                try {
                  return JSON.parse(snapshot);
                } catch {
                  return {};
                }
              })()
            : snapshot || {};

        // Provide sane defaults if UI didn’t set them
        if (!("focus" in snapshotObj) && !("scoringFocus" in snapshotObj)) {
          (snapshotObj as any).focus = "balance";
        }
        if (!("device" in snapshotObj)) {
          (snapshotObj as any).device = "desktop";
        }
        if (!("strictness" in snapshotObj)) {
          (snapshotObj as any).strictness = "balanced";
        }

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
            frameId: nodeId,
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
        ai_error = `mistral_error: ${
          e instanceof Error ? e.message : "unknown"
        }`;
      }

      if (ai && nodeId) {
        try {
          await supabase.from("design_frame_evaluations").upsert(
            {
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
                  try {
                    return JSON.parse(snapshot);
                  } catch {
                    return null;
                  }
                }
                return snapshot;
              })(),
              created_at: new Date().toISOString(),
              owner_id: user.id,
            },
            { onConflict: ["design_id", "node_id"] }
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
  const validResults = frameResults.filter((r) => r.ai);

  // Compute a robust per-frame score using tri-average logic with fallbacks
  // 1) If we have all three: heuristics_avg, category avg, bias_weighted_overall -> average them
  // 2) Else use debug_calc.final
  // 3) Else use ai.overall_score
  // 4) Else fallback to category avg or heuristic avg computed from heuristic_breakdown
  function computeFrameScore(ai: any): number {
    if (!ai || typeof ai !== "object") return 0;

    const debugCalc = ai?.debug_calc;

    // Heuristic average (% from heuristic_breakdown if heuristics_avg missing)
    let heurAvg: number | undefined =
      typeof debugCalc?.heuristics_avg === "number"
        ? debugCalc.heuristics_avg
        : undefined;

    if (heurAvg === undefined) {
      const hb: any[] = Array.isArray(ai?.heuristic_breakdown)
        ? ai.heuristic_breakdown
        : [];
      if (hb.length) {
        const pctSum = hb.reduce((acc, h) => {
          const s = typeof h?.score === "number" ? h.score : 0;
          const m =
            typeof h?.max_points === "number" && h.max_points > 0
              ? h.max_points
              : 4;
          return acc + (s / m) * 100;
        }, 0);
        heurAvg = Math.round(pctSum / hb.length);
      }
    }

    // Category average
    const catScoresObj =
      (ai as any)?.category_scores &&
      typeof (ai as any).category_scores === "object"
        ? (ai as any).category_scores
        : undefined;

    const catVals = catScoresObj
      ? Object.values(catScoresObj).filter(
          (v: any): v is number => typeof v === "number" && Number.isFinite(v)
        )
      : [];
    const catAvg =
      catVals.length > 0
        ? Math.round(
            catVals.reduce((a: number, b: number) => a + b, 0) / catVals.length
          )
        : undefined;

    // Bias weighted
    const biasWeighted =
      typeof debugCalc?.bias_weighted_overall === "number"
        ? debugCalc.bias_weighted_overall
        : typeof ai?.bias?.weighted_overall === "number"
        ? ai.bias.weighted_overall
        : undefined;

    const customTriAverage =
      typeof heurAvg === "number" &&
      typeof catAvg === "number" &&
      typeof biasWeighted === "number"
        ? Math.round((heurAvg + catAvg + biasWeighted) / 3)
        : undefined;

    if (typeof customTriAverage === "number") return customTriAverage;
    if (typeof debugCalc?.final === "number") return debugCalc.final;
    if (typeof ai?.overall_score === "number") return ai.overall_score;
    if (typeof catAvg === "number" && typeof heurAvg === "number")
      return Math.round((catAvg + heurAvg) / 2);
    if (typeof catAvg === "number") return catAvg;
    if (typeof heurAvg === "number") return heurAvg;
    return 0;
  }

  // Use the robust per-frame score for overall total_score
  const perFrameScores = validResults.map((r) => computeFrameScore(r.ai));
  const total_score = perFrameScores.length
    ? Math.round(
        perFrameScores.reduce((a, b) => a + b, 0) / perFrameScores.length
      )
    : 0;

  // Build a unified summary (not per-frame)
  function computeUnifiedSummary(
    results: any[],
    overallAvg: number,
    snapshotInput: any
  ) {
    // Parse snapshot to optionally compute improvement vs previous
    const snapshotObj =
      typeof snapshotInput === "string"
        ? (() => {
            try {
              return JSON.parse(snapshotInput);
            } catch {
              return {};
            }
          })()
        : snapshotInput || {};

    function getPrevOverall(snap: any): number | null {
      // Try direct numeric candidates first
      const numericCandidates = [
        snap?.prev_overall_score,
        snap?.prev_total_score,
        snap?.previous_total_score,
        snap?.previous?.overall_score,
        snap?.previous?.total_score,
        snap?.previousScores?.overall,
        snap?.prior?.total_score,
        snap?.last_total_score,
        snap?.overall_score,
        snap?.total_score,
        snap?.debug_calc?.final,
        snap?.bias?.weighted_overall,
      ];
      for (const v of numericCandidates) {
        if (typeof v === "number" && isFinite(v)) return Math.round(v);
      }

      // If we have previous frame-level AI objects, compute their aggregate
      const possibleArrays = [
        snap?.previous_frame_results, // [{ ai: {...} }]
        snap?.previous?.frameResults, // [{ ai: {...} }]
        snap?.frameResults, // maybe the snapshot is itself a previous payload
        snap?.previous_ai_list, // [{...ai}]
        snap?.ai_list, // [{...ai}]
      ];

      for (const arr of possibleArrays) {
        if (Array.isArray(arr) && arr.length) {
          // Accept both shapes: [{ ai: {...} }] or [{...ai}]
          const scores: number[] = arr
            .map((item: any) => {
              const aiObj =
                item?.ai && typeof item.ai === "object" ? item.ai : item;
              return computeFrameScore(aiObj);
            })
            .filter((n: any) => typeof n === "number" && isFinite(n));
          if (scores.length) {
            return Math.round(
              scores.reduce((a, b) => a + b, 0) / scores.length
            );
          }
        }
      }
      return null;
    }

    // Aggregate category scores if present; otherwise aggregate issues by category/type
    const categorySums: Record<string, { sum: number; count: number }> = {};
    const issueCounts: Record<string, number> = {};

    results.forEach((r) => {
      const ai = r.ai || {};
      const cs = ai.category_scores;
      if (cs && typeof cs === "object") {
        for (const [k, v] of Object.entries(cs)) {
          const num = typeof v === "number" ? v : NaN;
          if (!isNaN(num)) {
            if (!categorySums[k]) categorySums[k] = { sum: 0, count: 0 };
            categorySums[k].sum += num;
            categorySums[k].count += 1;
          }
        }
      }
      if (Array.isArray(ai.issues)) {
        ai.issues.forEach((iss: any) => {
          const key =
            iss?.category || iss?.type || iss?.title || "General usability";
          issueCounts[key] = (issueCounts[key] || 0) + 1;
        });
      }
    });

    const categoryAverages: Record<string, number> = {};
    for (const [k, v] of Object.entries(categorySums)) {
      categoryAverages[k] = Math.round(v.sum / Math.max(1, v.count));
    }

    const strengths = Object.entries(categoryAverages)
      .filter(([, v]) => v >= 80)
      .map(([k]) => k);
    const opportunities = Object.entries(categoryAverages)
      .filter(([, v]) => v <= 60)
      .map(([k]) => k);

    // Top issue themes
    const topIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);

    // Improvement sentence if previous is provided or derivable
    const prevOverall = getPrevOverall(snapshotObj);

    const delta =
      typeof prevOverall === "number" ? overallAvg - prevOverall : null;

    function generateScoreNarrative(): string {
      const strengthsList = strengths.slice(0, 3);
      const oppList = opportunities.slice(0, 3);
      const dir =
        delta == null
          ? ""
          : delta === 0
          ? " Performance is steady versus the previous evaluation."
          : delta > 0
          ? ` Improved by +${delta} points since the last run.`
          : ` Declined by ${delta} points since the last run.`;

      let tier: string;
      if (overallAvg >= 95)
        tier = "Exceptional execution with near best-practice consistency.";
      else if (overallAvg >= 85)
        tier = "High-performing design approaching best-practice quality.";
      else if (overallAvg >= 75)
        tier = "Strong, usable experience with refinement opportunities.";
      else if (overallAvg >= 60)
        tier = "Functional baseline with moderate UX polish needs.";
      else if (overallAvg >= 40)
        tier = "Foundational design with clear improvement potential.";
      else tier = "Critical UX issues require immediate structural attention.";

      const strengthsText = strengthsList.length
        ? ` Key strengths: ${strengthsList.join(", ")}.`
        : " No dominant strengths detected.";
      const oppsText = oppList.length
        ? ` Priority improvement areas: ${oppList.join(", ")}.`
        : " Limited high-impact weaknesses surfaced.";

      const issuesText = topIssues.length
        ? ` Recurring issue themes: ${topIssues.join(", ")}.`
        : "";

      return `For the record: Overall score ${overallAvg}/100. ${tier}${dir}${strengthsText}${oppsText}${issuesText}`.trim();
    }

    const improvementSentence =
      typeof prevOverall === "number"
        ? ` This is ${
            overallAvg === prevOverall
              ? "unchanged"
              : overallAvg > prevOverall
              ? "up"
              : "down"
          } ${Math.abs(overallAvg - prevOverall)} points from the previous run.`
        : "";

    const strengthsText =
      strengths.length > 0 ? `Strengths: ${strengths.join(", ")}.` : "";
    const oppsText =
      opportunities.length > 0
        ? `Opportunities: ${opportunities.join(", ")}.`
        : "";
    const issuesText =
      topIssues.length > 0
        ? `Most frequent issue areas: ${topIssues.join(", ")}.`
        : "";

    const short = [
      `Overall UX score: ${overallAvg}/100.${improvementSentence}`,
      strengthsText,
      oppsText,
    ]
      .filter(Boolean)
      .join(" ");

    const long = [
      `Unified evaluation across all frames yields an overall UX score of ${overallAvg}/100.${improvementSentence}`,
      strengthsText,
      oppsText,
      issuesText,
    ]
      .filter(Boolean)
      .join(" ");

    const narrative = generateScoreNarrative();

    return { short, long, narrative };
  }

  const unified = computeUnifiedSummary(validResults, total_score, snapshot);

  console.log(unified);

  function makeThreeSentenceSummary(text: string, count = 3): string {
    if (!text) return "";
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length === 0) return "";
    if (sentences.length <= count) {
      if (sentences.length < count) {
        const clauses = sentences[0]
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        if (clauses.length >= count) {
          return clauses
            .slice(0, count)
            .map((c) => (c.endsWith(".") ? c : c + "."))
            .join(" ");
        }
      }
      return sentences.join(" ");
    }

    const tokens = text.toLowerCase().match(/\w+/g) || [];
    const freq: Record<string, number> = {};
    tokens.forEach((w) => (freq[w] = (freq[w] || 0) + 1));

    const scored = sentences.map((s) => {
      const words = s.toLowerCase().match(/\w+/g) || [];
      const score =
        words.reduce((sum, w) => sum + (freq[w] || 0), 0) /
        Math.sqrt(Math.max(1, words.length));
      return { s, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, count).map((x) => x.s);
    const ordered = sentences.filter((s) => top.includes(s)).slice(0, count);
    return ordered.join(" ");
  }

  // sentiment (lightweight) — analyze unified long summary
  const sentimentAnalyzer = new Sentiment();
  const sentimentResult = unified.long
    ? sentimentAnalyzer.analyze(unified.long)
    : { score: 0, comparative: 0 };
  const sentimentLabel =
    sentimentResult.score > 0
      ? "positive"
      : sentimentResult.score < 0
      ? "negative"
      : "neutral";

  const threeSentenceSummary = makeThreeSentenceSummary(unified.narrative, 3);
  const summary = threeSentenceSummary || unified.narrative;
  const long_summary = unified.long;
  const narrative_summary = unified.narrative;

  const jobId = `${designId}-${versionId ?? "latest"}`;
  // console.log("[JobId]:", jobId);

  return {
    jobId,
    frameResults,
    validResults,
    total_score,
    summary,
    long_summary,
    narrative_summary,
    sentiment: {
      score: sentimentResult.score,
      comparative: sentimentResult.comparative,
      label: sentimentLabel,
    },
  };
}
