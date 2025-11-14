import { Mistral } from "@mistralai/mistralai";
import { aiIntroPrompt } from "./prompts/aiIntroPrompt/aiIntro";
import { genSegmentParams } from "./prompts/parameters/generations/genSegmentParams";
import { occupationParams } from "./prompts/parameters/occupations/occupationParams";
import { evaluatorReturnValues } from "./prompts/returnFormat/aiFormatUpdate";
import { genSegmentSb } from "./prompts/parameters/scoringBias/genSegmentSb";
import { occupationsSb } from "./prompts/parameters/scoringBias/occupationsSb";
import { calculateAIWeightedScoreWithHeuristics } from "../scoringMethod/calculateAIWeightedScoreWithHeuristics";
import { Generation, Occupation } from "../scoringMethod/evaluationWeights";
import { mapToIso9241 } from "../uxStandards/isoNielsenMapping";
import { HeuristicScores } from "../types/isoTypesHeuristic";
import {
  AccessibilityResult,
  LayoutResult,
} from "../uxStandards/heuristicMapping";
import { userScenarioMap } from "./prompts/context/userScenario";
import { businessGoalsMap } from "./prompts/context/businessGoals";
import { getAccessibilityRequirements } from "./prompts/context/accessibilityRequirements";
import {
  amplifyIssueSeverity,
  computeWeightedOverall,
  getScoringBiasProfile,
} from "./prompts/context/scoringBiases";
import {
  nielsenHeuristicLinks,
  recommendedResources,
  uxLaws,
  wcagHeuristicMapping,
} from "./prompts/resources/aiResources";
// import { frameTypeDescriptions } from "./prompts/context/frameTypeDescription";

export type AiEvaluator = {
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  issues: {
    id: string;
    severity: "low" | "medium" | "high";
    message: string;
    suggestion: string;
  }[];
  weakness_suggestions?: {
    element: string;
    suggestion: string;
    priority: "low" | "medium" | "high";
  }[];
  category_scores: {
    accessibility?: number;
    typography?: number;
    color?: number;
    layout?: number;
    hierarchy?: number;
    usability?: number;
  };
  // Debug calculation info (optional)
  debug_calc?: {
    heuristics_avg: number;
    categories_avg: number;
    combined: number;
    target: number;
    alpha: number; // 0.35
    blended: number; // alpha-blended value before extra pull
    extra_pull_applied: boolean;
    final: number; // final overall after all adjustments
    iteration: number;
    total_iterations: number;
  };
  // NEW: expose bias so UI can show it in a separate prompt
  bias?: {
    params: {
      generation?: Generation;
      occupation?: Occupation;
      focus:
        | "balance"
        | "accessibility"
        | "usability"
        | "readability"
        | "aesthetics"
        | "conversion";
      device: "mobile" | "desktop";
      strictness: "lenient" | "balanced" | "strict";
    };
    categoryWeights: Record<string, number>;
    severityMultipliers: {
      accessibility: number;
      usability: number;
      content: number;
    };
    weighted_overall: number;
  };
  // Optional: issues with computed multipliers for UI ordering
  _issues_amplified?: (AiEvaluator["issues"][number] & {
    _multiplier: number;
  })[];
};

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

  const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n));
  function seededFloat(seed: string): number {
    let h = 2166136261; // FNV-1a
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    const u = (h >>> 0) / 4294967295;
    return u;
  }
  function noise(seed: string, amplitude: number) {
    return (seededFloat(seed) * 2 - 1) * amplitude;
  }
  function targetRawForIteration(it: number, total: number) {
    if (it >= total) return 100;
    if (total <= 1) return 100;
    const start = 50;
    const end = 100;
    const t = (Math.max(1, Math.min(it, total)) - 1) / (total - 1); // 0..1
    return Math.round(start + t * (end - start));
  }

  const scoringMode: "raw" | "progressive" =
    (snapshot as any)?.scoringMode === "raw" ? "raw" : "progressive";

      function normalizeForIteration(parsed: AiEvaluator): AiEvaluator {
    // Categories list used in both branches
    const categories = [
      "accessibility",
      "typography",
      "color",
      "layout",
      "hierarchy",
      "usability",
    ] as const;

    // Optional previous categories to stabilize progression
    const prevCats =
      (snapshot as any)?.previousCategoryScores ||
      (snapshot as any)?.prevCategoryScores ||
      null;
    const enforceMonotonic = !!(snapshot as any)?.enforceMonotonic; // if true, never allow drops

    // Helper clamp
    const clamp = (n: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, n));

    // In raw mode, apply soft guardrails so categories don't collapse
    if (scoringMode === "raw") {
      const tgtRaw = targetRawForIteration(iteration, totalIterations);
      const band = 30; // keep within ±30 of the iteration target
      const minBand = tgtRaw - band;
      const maxBand = tgtRaw + band;

      const next: AiEvaluator = {
        ...parsed,
        category_scores: { ...(parsed.category_scores ?? {}) },
      };

      for (const c of categories) {
        const current = Number((next.category_scores as any)?.[c]);
        if (Number.isFinite(current)) {
          let val = current;

          // Guardrail around target
          val = clamp(Math.round(val), 0, 100);
          if (val < minBand) val = Math.max(minBand + 15, val); // lift extreme lows
          if (val > maxBand) val = Math.min(maxBand - 15, val); // cap extreme highs

          // Stabilize vs previous iteration
          const prev = Number(prevCats?.[c]);
          if (Number.isFinite(prev) && iteration > 1) {
            const maxDrop = enforceMonotonic ? 0 : 10; // allow at most -10 (or 0 if monotonic)
            val = Math.max(val, prev - maxDrop);
          }

          (next.category_scores as any)[c] = clamp(val, 0, 100);
        }
      }

      // If final iteration, drop weaknesses/issues
      if (iteration >= totalIterations) {
        next.weaknesses = [];
        next.weakness_suggestions = [];
        next.issues = [];
      }
      return next;
    }

    // Progressive mode (existing logic + stabilization)
    const tgtRaw = targetRawForIteration(iteration, totalIterations);

    const t =
      totalIterations > 1
        ? (Math.max(1, Math.min(iteration, totalIterations)) - 1) /
          (totalIterations - 1)
        : 1;
    const dev = Math.max(2, Math.round(6 + (2 - 6) * t));
    const minFinal = 95;

    const runSeed = String(
      (snapshot as any)?.versionId ?? (snapshot as any)?.jobId ?? ""
    );
    const seedBase =
      (context?.frameId ? String(context.frameId) : "") +
      "|" +
      String(iteration) +
      "|" +
      (imageUrl || "") +
      "|" +
      runSeed;

    const next: AiEvaluator = {
      ...parsed,
      category_scores: { ...(parsed.category_scores ?? {}) },
    };

    for (const c of categories) {
      const seed = `${seedBase}|${c}`;
      const n = noise(seed, dev);
      const h = Number.isFinite(heuristics?.[c as keyof typeof heuristics])
        ? (Number((heuristics as any)[c]) - 50) / 50
        : 0;
      const hAdj = h * Math.min(3, dev / 2);

      let cat = tgtRaw + n + hAdj;
      if (iteration >= totalIterations) cat = Math.max(minFinal, cat);
      let catRounded = clamp(Math.round(cat), 0, 100);

      // Stabilize vs previous iteration
      const prev = Number(prevCats?.[c]);
      if (Number.isFinite(prev) && iteration > 1) {
        const maxDrop = enforceMonotonic ? 0 : 10;
        catRounded = Math.max(catRounded, prev - maxDrop);
      }

      (next.category_scores as any)[c] = catRounded;
    }

    if (iteration >= totalIterations) {
      next.weaknesses = [];
      next.weakness_suggestions = [];
      next.issues = [];
    }
    return next;
  }
  
  function computeOverallFromCategories(cat: Record<string, number>): number {
    const vals = Object.values(cat).filter((v) => Number.isFinite(v));
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  const heuristicToCategory: Record<
    string,
    keyof AiEvaluator["category_scores"]
  > = {
    H1: "accessibility",
    H9: "accessibility",
    H2: "usability",
    H4: "usability",
    H5: "usability",
    H7: "usability",
    H8: "usability",
    H3: "layout",
    H6: "layout",
    H10: "hierarchy",
  };

  function aggregateCategoriesFromHeuristics(
    breakdown: any[]
  ): Record<string, number> {
    const acc: Record<string, { sum: number; count: number }> = {};
    for (const item of breakdown) {
      if (
        !item ||
        typeof item.score !== "number" ||
        typeof item.max_points !== "number" ||
        !item.code
      )
        continue;
      const cat = heuristicToCategory[item.code];
      if (!cat) continue;
      const pct =
        (Math.max(0, Math.min(item.score, item.max_points)) / item.max_points) *
        100;
      if (!acc[cat]) acc[cat] = { sum: 0, count: 0 };
      acc[cat].sum += pct;
      acc[cat].count += 1;
    }
    const out: Record<string, number> = {};
    for (const k of Object.keys(acc)) {
      out[k] = Math.round(acc[k].sum / acc[k].count);
    }
    return out;
  }

  function computeOverallFromHeuristics(breakdown: any[]): number {
    let total = 0;
    let count = 0;
    for (const item of breakdown) {
      if (
        item &&
        typeof item.score === "number" &&
        typeof item.max_points === "number" &&
        item.max_points > 0
      ) {
        total +=
          (Math.max(0, Math.min(item.score, item.max_points)) /
            item.max_points) *
          100;
        count++;
      }
    }
    return count ? Math.round(total / count) : 0;
  }

  function reconcileScores(
    candidate: AiEvaluator,
    iteration: number,
    totalIterations: number
  ): AiEvaluator {
    const out: AiEvaluator = { ...candidate };

    const breakdown = (candidate as any).heuristic_breakdown;
    const hasBreakdown = Array.isArray(breakdown) && breakdown.length > 0;

    if (hasBreakdown) {
      // Normalize scores (clamp) + ensure numeric
      for (const item of breakdown) {
        if (typeof item.max_points !== "number" || item.max_points <= 0) {
          item.max_points = 4;
        }
        if (typeof item.score !== "number") {
          item.score = Math.round(
            (targetRawForIteration(iteration, totalIterations) / 100) *
              item.max_points
          );
        }
        item.score = Math.max(
          0,
          Math.min(item.max_points, Math.round(item.score))
        );
      }

      // Derive categories from breakdown
      const derivedCats = aggregateCategoriesFromHeuristics(breakdown);

      // Merge/replace when existing category differs > 12 points
      out.category_scores = { ...(out.category_scores || {}) };
      for (const [k, v] of Object.entries(derivedCats)) {
        const existing = (out.category_scores as any)[k];
        if (
          !Number.isFinite(existing) ||
          Math.abs(existing - v) > 12 // threshold
        ) {
          (out.category_scores as any)[k] = v;
        }
      }

      // Derive overall from heuristics & categories (average of both)
      const overallFromHeuristics = computeOverallFromHeuristics(breakdown);
      const overallFromCats = computeOverallFromCategories(
        out.category_scores as any
      );
      const combined = Math.round(
        (overallFromHeuristics + overallFromCats) / 2
      );

      // Progression target
      const target = targetRawForIteration(iteration, totalIterations);

      // NEW: allow raw mode (no progression blending)

      const alpha = scoringMode === "raw" ? 0 : 0.35;

      const blended =
        iteration >= totalIterations && scoringMode !== "raw"
          ? 100
          : Math.round((1 - alpha) * combined + alpha * target);

      let finalOverall =
        scoringMode === "raw"
          ? combined
          : iteration >= totalIterations
          ? 100
          : blended;

      let extraPullApplied = false;

      // If still off by >15 from target early on, pull a bit more
      if (
        scoringMode !== "raw" &&
        iteration < totalIterations &&
        Math.abs(finalOverall - target) > 15
      ) {
        finalOverall = Math.round((finalOverall + target) / 2);
        extraPullApplied = true;
      }

      out.overall_score = clamp(finalOverall, 0, 100);
      out.debug_calc = {
        heuristics_avg: overallFromHeuristics,
        categories_avg: overallFromCats,
        combined,
        target,
        alpha,
        blended,
        extra_pull_applied: extraPullApplied,
        final: out.overall_score,
        iteration,
        total_iterations: totalIterations,
      };
    } else {
      // No breakdown: fall back to categories → overall
      if (!out.category_scores) out.category_scores = {};
      out.overall_score = computeOverallFromCategories(
        out.category_scores as any
      );
    }

    return out;
  }

  function selectResourceRecommendations() {
    const lowHeuristics: string[] = [];
    const breakdown: any[] = (snapshot as any)?.heuristic_breakdown || [];
    for (const hCode of Object.keys(heuristicMap)) {
      const val = heuristicMap[hCode as keyof typeof heuristicMap];
      if (typeof val === "number" && val < 55) {
        lowHeuristics.push(hCode);
      }
    }
    // Fallback: if we have AI breakdown later, pass codes with score<=2
    for (const b of breakdown) {
      if (b && typeof b.score === "number" && b.score <= 2 && b.code) {
        if (!lowHeuristics.includes(b.code)) lowHeuristics.push(b.code);
      }
    }

    // Map heuristic code to Nielsen name (rough)
    const nielsenNameMap: Record<string, string> = {
      H1: "Visibility of System Status",
      H2: "Match Between System and the Real World",
      H3: "User Control and Freedom",
      H4: "Consistency and Standards",
      H5: "Error Prevention",
      H6: "Recognition Rather Than Recall",
      H7: "Flexibility and Efficiency of Use",
      H8: "Aesthetic and Minimalist Design",
      H9: "Help Users Recognize, Diagnose, and Recover from Errors",
      H10: "Help and Documentation",
    };

    const picks: {
      title: string;
      url: string;
      description: string;
      related?: string;
      reason?: string;
    }[] = [];

    // Add core recommended resources (limit 5)
    for (const r of recommendedResources.slice(0, 5)) {
      picks.push({ ...r, related: "General UI/UX" });
    }

    // Add WCAG mapping if any accessibility heuristics flagged
    if (lowHeuristics.includes("H1") || lowHeuristics.includes("H9")) {
      picks.push({
        title: wcagHeuristicMapping.title,
        url: wcagHeuristicMapping.url,
        description: wcagHeuristicMapping.description,
        related: "Accessibility & Error Feedback",
        reason:
          "Low performance on H1/H9 suggests reinforcing status/error messaging accessibility.",
      });
    }

    // Add Nielsen base link if multiple heuristics low
    if (lowHeuristics.length >= 3) {
      picks.push({
        title: nielsenHeuristicLinks[0].title,
        url: nielsenHeuristicLinks[0].url,
        description:
          "Authoritative reference for usability principles relevant to multiple weak heuristics.",
        related: "Multiple low heuristics",
        reason: `Low scores detected for: ${lowHeuristics
          .map((c) => `${c} (${nielsenNameMap[c]})`)
          .join(", ")}`,
      });
    }

    // Add UX laws context for layout / efficiency problems
    const addLaw = (lawName: string) => {
      const law = uxLaws.find((l) => l.law === lawName);
      if (law) {
        picks.push({
          title: law.law,
          url: law.url,
          description: law.principle,
          related: "UX Law",
          reason: law.when_to_recommend,
        });
      }
    };

    if (lowHeuristics.includes("H7")) addLaw("Hick's Law");
    if (lowHeuristics.includes("H3")) addLaw("Jakob's Law");
    if (lowHeuristics.includes("H8")) addLaw("Aesthetic-Usability Effect");
    if (lowHeuristics.includes("H5")) addLaw("Postel's Law");
    if (lowHeuristics.includes("H4")) addLaw("Consistency and Standards"); // handled via Nielsen link already

    // Deduplicate by URL
    const dedup = picks.filter(
      (v, i, arr) => arr.findIndex((o) => o.url === v.url) === i
    );
    return dedup.slice(0, 10);
  }

  const resourceSubset = selectResourceRecommendations();

  const prompt = `
  Instructions:
  This is iteration ${iteration} of ${totalIterations}. You must follow:
  - All numeric scores between 0 and 100.
  - Aim scores near the current iteration target ≈ ${targetRawForIteration(
    iteration,
    totalIterations
  )}.
  - Final iteration (${totalIterations}) = 100 (perfect). No weaknesses or resources then.
  - Heuristic breakdown MUST numerically justify category_scores and overall_score (they must be consistent).
  - Do NOT reuse a canned heuristic_breakdown; generate it from the supplied context.
  
  Panel-ready guidance:
    - Concise, professional, evidence-based.
    - Each justification references persona or concrete UI evidence.
    - Summary 2-4 sentences, starts with: "For a ${generation ?? "N/A"} ${
    occupation ?? "N/A"
  },".

  Persona:
    - Generation: ${generation ?? "N/A"}
    - Occupation: ${occupation ?? "N/A"}
    
  ResourceContext:
  The following curated external references are available. ONLY include items in the "resources" array when they directly support a weakness or improvement suggestion. For each included resource, connect it explicitly to the related heuristic code(s) or category:
  ${JSON.stringify(resourceSubset, null, 2)}

  UX Law Guidance:
  - If a weakness maps clearly to a known UX law (e.g., Hick's Law for choice overload, Fitts's Law for tiny tap targets), reference that law briefly in the justification or suggestion.

    
    Return ONLY valid JSON:
    \`\`\`json
    {
      "overall_score": number (0-100),
      "summary": string,
      "strengths": [
      {
        "element": string,
        "description": string,
        "relatedHeuristic": "H1"|"H2"|"H3"|"H4"|"H5"|"H6"|"H7"|"H8"|"H9"|"H10",
        "impactLevel": "low" | "medium" | "high"
        }
      ],
      "weaknesses": [
       {
        "element": string,
        "description": string,
        "relatedHeuristic": string,
        "relatedHeuristic": "H1"|"H2"|"H3"|"H4"|"H5"|"H6"|"H7"|"H8"|"H9"|"H10",
        "impactLevel": "low" | "medium" | "high"
        }
     ],
     "weakness_suggestions": [
       {
         "element": string,
         "suggestion": string,
         "priority": "low" | "medium" | "high"
       }
     ],
      "category_scores": {
        "accessibility": number,
        "typography": number,
        "color": number,
        "layout": number,
        "hierarchy": number,
        "usability": number
      },
      "category_score_justifications": {
        "accessibility": string,
        "typography": string,
        "color": string,
        "layout": string,
        "hierarchy": string,
        "usability": string
      },
      "heuristic_breakdown": [
      {
        "principle": string,
        "code": "H1"|"H2"|"H3"|"H4"|"H5"|"H6"|"H7"|"H8"|"H9"|"H10",
        "max_points": 4,
        "score": number (0-4),
        "evaluation_focus": string,
        "justification": string
      }
    ],
        "resources": [
      {
        "issue_id": string,            // match a weakness or issue id if available
        "title": string,
        "url": string,
        "description": string,
        "related": string,             // heuristic code(s) or category name
        "reason": string               // brief rationale referencing the weakness or heuristic gap
      }
    }

    \`\`\`
  Constraints:
  - Heuristic scores (score/max_points) when converted to percentages must logically support category_scores and overall_score.
  - If iteration < ${totalIterations}, include weaknesses & suggestions.
  - If iteration = ${totalIterations}, omit weaknesses & suggestions and omit resources.
  - Avoid generic feedback; anchor every strength/weakness to actual UI/text evidence and persona parameters.
  - Each category_score justification must cite at least one concrete heuristic or UI element.
  - When recommending resources, only pick from provided ResourceContext and tie them to specific weaknesses or improvement opportunities clearly.
  - If no resource is directly helpful, return an empty resources array.
    `;
  try {
    const completion = await client.chat.complete({
      model: "ft:ministral-8b-latest:521112c6:20251101:fbb300c8",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            // {
            //     type: "image_url", imageUrl: { url: imageUrl }
            // }
          ],
        },
      ],
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
    const completion = await client.chat.complete({
      model: "ft:ministral-8b-latest:521112c6:20251101:fbb300c8",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            // {
            //     type: "image_url", imageUrl: { url: imageUrl }
            // }
          ],
        },
      ],
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

      function looksStatic(resp: AiEvaluator) {
        const hasCategories =
          resp.category_scores && Object.keys(resp.category_scores).length > 0;
        const sparseText =
          (resp.summary || "").length < 40 &&
          (resp.strengths?.length ?? 0) === 0 &&
          (resp.weaknesses?.length ?? 0) === 0;
        const forcedRange =
          typeof resp.overall_score === "number" &&
          resp.overall_score >= 45 &&
          resp.overall_score <= 70;
        return (!hasCategories || sparseText) && forcedRange;
      }

      function ensurePersonaInSummary(
        summary: string | undefined,
        gen?: string,
        occ?: string
      ) {
        const s = (summary ?? "").trim();
        const g = (gen ?? "").trim();
        const o = (occ ?? "").trim();
        if (!g && !o) return s;
        const needleG = g.toLowerCase();
        const needleO = o.toLowerCase();
        const hasG = needleG && s.toLowerCase().includes(needleG);
        const hasO = needleO && s.toLowerCase().includes(needleO);
        if (hasG && hasO) return s;
        const prefix = `For a ${g || "user"}${o ? ` ${o}` : ""}, `;
        return s.startsWith("For a ") ? s : `${prefix}${s}`;
      }

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

      candidate = reconcileScores(candidate, iteration, totalIterations);
      const progressed = normalizeForIteration(candidate);

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
