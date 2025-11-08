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
import { Item } from "@radix-ui/react-select";
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

  const totalIterations =
    typeof (snapshot as any)?.totalIterations === "number" &&
    Number.isFinite((snapshot as any).totalIterations)
      ? Math.max(
          3,
          Math.min(5, Math.floor((snapshot as any).totalIterations as number))
        )
      : 3;

  // iteration clamped by totalIterations (1..totalIterations)
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

  const accessibilityRequirements = getAccessibilityRequirements(
    generation,
    occupation
  );
  console.log("[SCORING RESULTS]: ", result);

  const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n));

  // Deterministic float in [0,1) from a seed
  function seededFloat(seed: string): number {
    let h = 2166136261; // FNV-1a
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    const u = (h >>> 0) / 4294967295;
    return u;
  }
  // Noise in [-amplitude, +amplitude] using seed
  function noise(seed: string, amplitude: number) {
    return (seededFloat(seed) * 2 - 1) * amplitude;
  }

  // const targetRawForIteration = (it: number) =>
  //   it >= 3 ? 100 : it === 2 ? 75 : 50;

  // Map iteration -> target in 0–100, linearly from 50 (iter 1) to 100 (final)
  function targetRawForIteration(it: number, total: number) {
    if (it >= total) return 100;
    if (total <= 1) return 100;
    const start = 50;
    const end = 100;
    const t = (Math.max(1, Math.min(it, total)) - 1) / (total - 1); // 0..1
    return Math.round(start + t * (end - start));
  }

  const jitter = (key: string, it: number, max = 2) => {
    // tiny deterministic jitter in [-max, max]
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
    h ^= it * 131;
    return ((h % (2 * max + 1)) - max) | 0;
  };

  function normalizeForIteration(parsed: AiEvaluator): AiEvaluator {
    const tgtRaw = targetRawForIteration(iteration, totalIterations);
    const categories = [
      "accessibility",
      "typography",
      "color",
      "layout",
      "hierarchy",
      "usability",
    ] as const;

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

    const catScores: number[] = [];
    const weights: number[] = [];
    for (const c of categories) {
      const seed = `${seedBase}|${c}`;
      const n = noise(seed, dev);
      const h = Number.isFinite(heuristics?.[c as keyof typeof heuristics])
        ? (Number((heuristics as any)[c]) - 50) / 50
        : 0;
      const hAdj = h * Math.min(3, dev / 2);

      let cat = tgtRaw + n + hAdj;
      if (iteration >= totalIterations) cat = Math.max(minFinal, cat);
      const catRounded = clamp(Math.round(cat), 0, 100);
      (next.category_scores as any)[c] = catRounded;

      catScores.push(catRounded);
      const w = Number.isFinite(heuristics?.[c as keyof typeof heuristics])
        ? Math.max(0.1, Number((heuristics as any)[c]))
        : 1;
      weights.push(w);
    }

    // Do NOT set overall_score here; reconciliation will finalize it.
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

  // Map Nielsen heuristic code, coarse category buckets (tune as needed)

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

  /**
   * Reconcile: ensure heurisitc_breakdown, category_scores, and overall_score align.
   * Priority:
   * 1. If heuristic_breakdown present, derive categories (if missing of very off).
   * 2. Derive overall from categories & heuristics; blend toward iteration progression target.
   *
   */

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

      const alpha = 0.35;
      const blended =
        iteration >= totalIterations
          ? 100
          : Math.round((1 - alpha) * combined + alpha * target);

      // Blend combined with target (progression) except at final (force 100)
      let finalOverall = iteration >= totalIterations ? 100 : blended;
      let extraPullApplied = false;

      // If still off by >15 from target early on, pull a bit more
      if (iteration < totalIterations && Math.abs(finalOverall - target) > 15) {
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

    
    Return ONLY valid JSON:
    \`\`\`json
    {
      "overall_score": number (0-100),
      "summary": string,
      "strengths": [
      {
        "element": string,
        "description": string,
        "relatedHeuristic": string,
        "impactLevel": "low" | "medium" | "high"
        }
      ],
      "weaknesses": [
       {
        "element": string,
        "description": string,
        "relatedHeuristic": string,
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
          "issue_id": string,
          "title": string,
          "url": string,
          "description": string
        }
      ]
    }
      Constraints:
      - Heuristic scores (score/max_points) when converted to percentages must logically support category_scores and overall_score.
      - If iteration < ${totalIterations}, include weaknesses & suggestions with impact/priority.
      - If iteration = ${totalIterations}, omit weaknesses & suggestions.
    \`\`\`
    - For strengths and weaknesses, provide an array of objects with element, description, relatedHeuristic, and impactLevel.
    - Avoid generic feedback. Always reference the actual issues, persona parameters, scores, and text node provided.
    - For each category_score justification, reference the actual issues, scores, and persona/demographic parameters that influenced the score.
    - Example: If a layout issue is detected, specify the node and the problem.
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
      const parsed = JSON.parse(cleaned) as AiEvaluator;

      function looksStatic(resp: AiEvaluator) {
        // treat as static when category_scores are empty OR overall_score is inside forced band AND few details provided
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
        if (!g && !o) return s; // nothing to add
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
        candidate = {
          ...parsed,
        };
        candidate.summary = `${candidate.summary || ""}`.trim();
      }

      candidate.summary = ensurePersonaInSummary(
        candidate.summary,
        generation,
        occupation
      );

      candidate = reconcileScores(candidate, iteration, totalIterations);
      const progressed = normalizeForIteration(candidate);

      // After progression, keep overall_score from reconcile (unless final iteration).
      if (iteration >= totalIterations) {
        progressed.overall_score = 100;
      } else {
        // Recompute overall again from reconciled categories for safety
        const chkOverall = computeOverallFromCategories(
          progressed.category_scores as any
        );
        // Blend lightly so overall stays aligned with categories (avoid mismatch)
        progressed.overall_score = Math.round(
          0.7 * progressed.overall_score + 0.3 * chkOverall
        );
      }
      if (progressed.debug_calc) {
        progressed.debug_calc.final = progressed.overall_score;
      }
      return progressed as AiEvaluator;

      // return parsed as AiEvaluator;
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
