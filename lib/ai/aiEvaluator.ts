import { Mistral } from "@mistralai/mistralai";
import { calculateAIWeightedScoreWithHeuristics } from "../scoringMethod/calculateAIWeightedScoreWithHeuristics";
import { Generation, Occupation } from "../scoringMethod/evaluationWeights";
import { mapToIso9241 } from "../uxStandards/isoNielsenMapping";
import { HeuristicScores } from "../types/isoTypesHeuristic";
import {
  amplifyIssueSeverity,
  computeWeightedOverall,
  getScoringBiasProfile,
} from "./prompts/context/scoringBiases";
import {
  buildUiEvidence,
  calibratedCategoryFromHeuristic,
  computeOverallFromCategories,
  ensurePersonaInSummary,
  looksStatic,
  normalizeForIteration,
  reconcileScores,
  selectResourceRecommendations,
  targetRawForIteration,
} from "@/utils/scoring/aiScoringUtils";
import { AiEvaluator } from "../types/aiEvaluator";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

export async function aiEvaluator(
  imageUrl: string,
  heuristics: Record<string, number>,
  context: {
    accessibilityResults?: any;
    layoutResults?: any;
    textNodes?: any;
    textSummary?: any;
    normalizedFrames?: any;
    frameId?: string;
  },
  snapshot?: Record<string, unknown>
): Promise<AiEvaluator | null> {
  if (!MISTRAL_API_KEY) return null;

  const client = new Mistral({ apiKey: MISTRAL_API_KEY });
  const limitedFrames = Array.isArray(context?.layoutResults)
    ? context.layoutResults
    : [];

  console.log("FRAMES SENT TO AI: ", limitedFrames);
  console.log("Snapshot received: ", snapshot);
  console.log("CONTEXT AI PARAMETERS: ", context);
  console.log("HEURISTIC DATA: ");

  const heuristicMap = heuristics;

  const generation = snapshot?.age as Generation;
  const occupation = snapshot?.occupation as Occupation;

  const focus = ((snapshot as any)?.focus ??
    (snapshot as any)?.scoringFocus ??
    "balance") as
    | "balance"
    | "accessibility"
    | "usability"
    | "readability"
    | "aesthetics"
    | "conversion";
  const device = (((snapshot as any)?.device as string) || "desktop") as
    | "mobile"
    | "desktop";
  const strictness = (((snapshot as any)?.strictness as string) ||
    "balanced") as "lenient" | "balanced" | "strict";

  // Build bias profile once for this evaluation
  const bias = getScoringBiasProfile({
    generation,
    occupation,
    focus,
    device,
    strictness,
  });

  console.log("[BIAS] params:", {
    generation,
    occupation,
    focus,
    device,
    strictness,
  });
  console.log("[BIAS] categoryWeights:", bias.categoryWeights);
  console.log("[BIAS] severityMultipliers:", bias.severityMultipliers);

  const totalIterations =
    typeof (snapshot as any)?.totalIterations === "number" &&
    Number.isFinite((snapshot as any).totalIterations)
      ? Math.max(
          3,
          Math.min(5, Math.floor((snapshot as any).totalIterations as number))
        )
      : 3;

  const iteration =
    typeof (snapshot as any)?.iteration === "number" &&
    Number.isFinite((snapshot as any).iteration)
      ? Math.max(
          1,
          Math.min(
            totalIterations,
            Math.floor((snapshot as any).iteration as number)
          )
        )
      : 1;

  console.log("Generation: ", generation);
  console.log("Occupation: ", occupation);

  const result = calculateAIWeightedScoreWithHeuristics(
    heuristicMap,
    generation,
    occupation
  );

  const heuristicScores: HeuristicScores = {
    layout: heuristics.layout ?? 0,
    typography: heuristics.typography ?? 0,
    color: heuristics.color ?? 0,
    accessibility: heuristics.accessibility ?? 0,
    usability: heuristics.usability ?? 0,
  };

  const isoScores = mapToIso9241(heuristicScores);

  console.log(result);
  console.log("[SCORING RESULTS]: ", result);

  const scoringMode: "raw" | "progressive" =
    (snapshot as any)?.scoringMode === "raw" ? "raw" : "progressive";

  const resourceSubset = selectResourceRecommendations(heuristicMap, snapshot);

  // PREVIOUS INTERATION OF PROMPTING..
  // const prompt = `
  // Instructions:
  // This is iteration ${iteration} of ${totalIterations}. You must follow:
  // - All numeric scores between 0 and 100.
  // - Aim scores near the current iteration target ≈ ${targetRawForIteration(
  //   iteration,
  //   totalIterations
  // )}.
  // - Final iteration (${totalIterations}) = 100 (perfect). No weaknesses or resources then.
  // - Heuristic breakdown MUST numerically justify category_scores and overall_score (they must be consistent).
  // - Do NOT reuse a canned heuristic_breakdown; generate it from the supplied context.

  // Panel-ready guidance:
  //   - Concise, professional, evidence-based.
  //   - Each justification references persona or concrete UI evidence.
  //   - Summary 2-4 sentences, starts with: "For a ${generation ?? "N/A"} ${
  //   occupation ?? "N/A"
  // },".

  // Persona:
  //   - Generation: ${generation ?? "N/A"}
  //   - Occupation: ${occupation ?? "N/A"}

  // ResourceContext:
  // The following curated external references are available. ONLY include items in the "resources" array when they directly support a weakness or improvement suggestion. For each included resource, connect it explicitly to the related heuristic code(s) or category:
  // ${JSON.stringify(resourceSubset, null, 2)}

  // UX Law Guidance:
  // - If a weakness maps clearly to a known UX law (e.g., Hick's Law for choice overload, Fitts's Law for tiny tap targets), reference that law briefly in the justification or suggestion.

  //   Return ONLY valid JSON:
  //   \`\`\`json
  //   {
  //     "overall_score": number (0-100),
  //     "summary": string,
  //     "strengths": [
  //     {
  //       "element": string,
  //       "description": string,
  //       "relatedHeuristic": "H1"|"H2"|"H3"|"H4"|"H5"|"H6"|"H7"|"H8"|"H9"|"H10",
  //       "impactLevel": "low" | "medium" | "high"
  //       }
  //     ],
  //     "weaknesses": [
  //      {
  //       "element": string,
  //       "description": string,
  //       "relatedHeuristic": string,
  //       "relatedHeuristic": "H1"|"H2"|"H3"|"H4"|"H5"|"H6"|"H7"|"H8"|"H9"|"H10",
  //       "impactLevel": "low" | "medium" | "high"
  //       }
  //    ],
  //    "weakness_suggestions": [
  //      {
  //        "element": string,
  //        "suggestion": string,
  //        "priority": "low" | "medium" | "high"
  //      }
  //    ],
  //     "category_scores": {
  //       "accessibility": number,
  //       "typography": number,
  //       "color": number,
  //       "layout": number,
  //       "hierarchy": number,
  //       "usability": number
  //     },
  //     "category_score_justifications": {
  //       "accessibility": string,
  //       "typography": string,
  //       "color": string,
  //       "layout": string,
  //       "hierarchy": string,
  //       "usability": string
  //     },
  //     "heuristic_breakdown": [
  //     {
  //       "principle": string,
  //       "code": "H1"|"H2"|"H3"|"H4"|"H5"|"H6"|"H7"|"H8"|"H9"|"H10",
  //       "max_points": 4,
  //       "score": number (0-4),
  //       "evaluation_focus": string,
  //       "justification": string
  //     }
  //   ],
  //       "resources": [
  //     {
  //       "issue_id": string,            // match a weakness or issue id if available
  //       "title": string,
  //       "url": string,
  //       "description": string,
  //       "related": string,             // heuristic code(s) or category name
  //       "reason": string               // brief rationale referencing the weakness or heuristic gap
  //     }
  //   }

  //   \`\`\`
  // Constraints:
  // - Heuristic scores (score/max_points) when converted to percentages must logically support category_scores and overall_score.
  // - If iteration < ${totalIterations}, include weaknesses & suggestions.
  // - If iteration = ${totalIterations}, omit weaknesses & suggestions and omit resources.
  // - Avoid generic feedback; anchor every strength/weakness to actual UI/text evidence and persona parameters.
  // - Each category_score justification must cite at least one concrete heuristic or UI element.
  // - When recommending resources, only pick from provided ResourceContext and tie them to specific weaknesses or improvement opportunities clearly.
  // - If no resource is directly helpful, return an empty resources array.
  //   `;

  const heuristicAnchors = {
    accessibility: calibratedCategoryFromHeuristic(
      heuristics.accessibility ?? 50
    ),
    typography: calibratedCategoryFromHeuristic(heuristics.typography ?? 50),
    color: calibratedCategoryFromHeuristic(heuristics.color ?? 50),
    layout: calibratedCategoryFromHeuristic(heuristics.layout ?? 50),
    usability: calibratedCategoryFromHeuristic(heuristics.usability ?? 50),
    hierarchy: calibratedCategoryFromHeuristic(
      heuristics.hierarchy ?? heuristics.layout ?? 50
    ),
  };

  const uiEvidence = buildUiEvidence(context);

  const fewShot = `
Example A:
{
  "overall_score": 62,
  "category_scores": { "accessibility": 58, "typography": 66, "color": 60, "layout": 63, "hierarchy": 59, "usability": 64 },
  "heuristic_breakdown": [
    { "principle": "Visibility of system status", "code": "H1", "max_points": 4, "score": 3, "evaluation_focus": "feedback timing", "justification": "Loading indicator appears but lacks progress granularity for older users." }
  ]
}
Example B:
{
  "overall_score": 74,
  "category_scores": { "accessibility": 70, "typography": 78, "color": 72, "layout": 76, "hierarchy": 73, "usability": 75 },
  "heuristic_breakdown": [
    { "principle": "Aesthetic and minimalist design", "code": "H8", "max_points": 4, "score": 2, "evaluation_focus": "visual economy", "justification": "Dense card grouping increases cognitive load for non-specialists." }
  ]
}
`;

  const prompt = `
You are performing heuristic UI evaluation. Use provided anchors; you may deviate by ±12 if justified by UI evidence.

Persona:
Generation: ${generation ?? "N/A"}
Occupation: ${occupation ?? "N/A"}
Focus bias: ${focus}; Device: ${device}; Strictness: ${strictness}

Heuristic numeric anchors (pre-calibrated):
${JSON.stringify(heuristicAnchors, null, 2)}

UI Evidence (frame inventory):
${uiEvidence || "NONE"}

Few-shot formatting guidance (do NOT copy verbatim; vary structure):
${fewShot}

Resources (eligible):
${JSON.stringify(resourceSubset, null, 2)}

Return ONLY JSON as specified earlier. Ensure:
- heuristic_breakdown aligns with category_scores.
- Justifications cite concrete elements (frame ids / roles).
- Avoid repeating previous iteration phrasing: ${(snapshot as any)?.previousSummary || "NONE"}.
${iteration < totalIterations ? "Include weaknesses & suggestions." : "Final iteration: omit weaknesses, suggestions, resources."}
`;

  try {
      const completion = await client.chat.complete({
    model: "pixtral-12b",
    temperature: 0.25,
    topP: 0.9,
    messages: [
      { role: "system", content: [{ type: "text", text: "You are a UX evaluation assistant. Provide evidence-grounded, varied scoring." }] },
      { role: "user", content: [{ type: "text", text: prompt }] }
    ]
  });
    const msg = completion?.choices?.[0]?.message;
    console.log(msg);
    const contentStr: string | undefined =
      typeof msg?.content === "string"
        ? msg.content
        : Array.isArray(msg?.content)
        ? (
            msg.content.find((p) => p.type === "text" && "text" in p) as
              | { type: "text"; text: string }
              | undefined
          )?.text
        : undefined;
    if (!contentStr) return null;

    const cleaned = contentStr
      .replace(/^\s*```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as AiEvaluator;

      let candidate: AiEvaluator = parsed;
      if (parsed && looksStatic(parsed)) {
        candidate = { ...parsed };
        candidate.summary = `${candidate.summary || ""}`.trim();
      }

      candidate.summary = ensurePersonaInSummary(
        candidate.summary,
        generation,
        occupation
      );

      candidate = reconcileScores(
        candidate,
        iteration,
        totalIterations,
        scoringMode
      );
      const progressed = normalizeForIteration(candidate, {
        iteration,
        totalIterations,
        scoringMode,
        heuristics: heuristicMap,
        snapshot,
        context,
        imageUrl,
      });

      // Amplify issues (metadata only)
      if (Array.isArray(progressed.issues) && progressed.issues.length) {
        const amplified = amplifyIssueSeverity(
          progressed.issues as any,
          bias.severityMultipliers
        );
        (progressed as any)._issues_amplified = amplified;
      }

      // Progressive adjustment before bias blending
      if (iteration >= totalIterations) {
        progressed.overall_score =
          (snapshot as any)?.scoringMode === "raw"
            ? progressed.overall_score
            : 100;
      } else if ((snapshot as any)?.scoringMode !== "raw") {
        const chkOverall = computeOverallFromCategories(
          progressed.category_scores as any
        );
        progressed.overall_score = Math.round(
          0.7 * progressed.overall_score + 0.3 * chkOverall
        );
      }

      // Bias-weighted overall
      const weightedOverall = computeWeightedOverall(
        progressed.category_scores as any,
        bias.categoryWeights
      );

      const biasBlend = (snapshot as any)?.scoringMode === "raw" ? 0.5 : 0.4;
      const baseOverall = progressed.overall_score ?? 0;
      progressed.overall_score = Math.round(
        (1 - biasBlend) * baseOverall + biasBlend * weightedOverall
      );

      if (progressed.debug_calc) {
        progressed.debug_calc.final = progressed.overall_score;
        (progressed.debug_calc as any).bias_weighted_overall =
          Math.round(weightedOverall);
      }

      (progressed as any).bias = {
        params: { generation, occupation, focus, device, strictness },
        categoryWeights: bias.categoryWeights,
        severityMultipliers: bias.severityMultipliers,
        weighted_overall: Math.round(weightedOverall),
      };

      return progressed as AiEvaluator;
    } catch {
      const match = contentStr.match(/\{[\s\S]*\}$/);
      if (match) {
        try {
          return JSON.parse(match[0]) as AiEvaluator;
        } catch (err2) {
          console.warn("Failed to parse extracted JSON: ", err2);
        }
      }
    }
    console.warn("AI produced non-JSON response, saving raw text as summary.");
    return {
      overall_score: 0,
      summary: cleaned,
      strengths: [],
      weaknesses: [],
      issues: [],
      category_scores: {},
      iso_scores: isoScores,
    } as AiEvaluator;
  } catch (err: unknown) {
    console.log(err);
    return null;
  }
}
