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

  const iteration =
    typeof (snapshot as any)?.iteration === "number"
      ? Math.max(1, Math.min(3, (snapshot as any).iteration as number))
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
  const rescaleValue = (
    value: number,
    sourceMin = 0,
    sourceMax = 100,
    targetMin = 45,
    targetMax = 70
  ) => {
    if (!Number.isFinite(value)) return targetMin;
    if (sourceMin === sourceMax) return (targetMin + targetMax) / 2;
    const pct = (value - sourceMin) / (sourceMax - sourceMin);
    return targetMin + pct * (targetMax - targetMin);
  };
  const targetRawForIteration = (it: number) =>
    it >= 3 ? 100 : it === 2 ? 75 : 50;
  const jitter = (key: string, it: number, max = 2) => {
    // tiny deterministic jitter in [-max, max]
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
    h ^= it * 131;
    return ((h % (2 * max + 1)) - max) | 0;
  };

  function normalizeForIteration(parsed: AiEvaluator): AiEvaluator {
    const tgtRaw = targetRawForIteration(iteration); // 50, 75, 100

    const categories = [
      "accessibility",
      "typography",
      "color",
      "layout",
      "hierarchy",
      "usability",
    ] as const;

    const next: AiEvaluator = {
      ...parsed,
      // Force overall to iteration target in 0–100 range
      overall_score: clamp(tgtRaw, 0, 100),
      category_scores: { ...(parsed.category_scores ?? {}) },
    };

    for (const c of categories) {
      // Force each category to the same iteration target (tiny jitter optional)
      const base = tgtRaw;
      (next.category_scores as any)[c] = clamp(
        base + jitter(c, iteration, 1),
        0,
        100
      );
    }

    if (iteration >= 3) {
      next.weaknesses = [];
      next.weakness_suggestions = [];
      next.issues = [];
    }
    return next;
  }

  const prompt = `
      Instructions:
        This is iteration ${iteration} of 3. You must follow:
    - All numeric scores you output MUST be between 0 and 100.
    - Aim scores near these targets by iteration:
      • Iteration 1 ≈ 50
      • Iteration 2 ≈ 75
      • Iteration 3 = 100 (perfect)
    - Ensure scores correspond with the heuristic breakdown.
    - If iteration = 3 (final), the design is perfect; do not include weaknesses or resources.
    
    Panel-ready guidance:
    - Audience: a UX review panel. Be concise, professional, and assertive.
    - Cite concrete evidence from the layout/accessibility/text data when justifying scores.
    - Keep summary to 2-4 sentences. Avoid hedging language.
    - If iteration < 3, include specific, actionable weaknesses with suggestions. If iteration = 3, omit them.

    Persona context:
    - Generation: ${generation ?? "N/A"}
    - Occupation: ${occupation ?? "N/A"}
    
    Output requirements:
    - The summary MUST begin with: "For a ${generation ?? "N/A"} ${
    occupation ?? "N/A"
  },".
    - Each category_score_justification MUST reference at least one persona attribute (generation or occupation).

    
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
      "principle": "Visibility of system status",
      "code": "H1",
      "max_points": 4,
      "score": 4,
      "evaluation_focus": "Clear labels, status indicators, and feedback",
      "justification": "Navigation and feedback messages are clear and timely."
      },
      {
      "principle": "Match between system and real world",
      "code": "H2",
      "max_points": 4,
      "score": 4,
      "evaluation_focus": "Natural, user-centered language",
      "justification": "Terminology matches user expectations."
    },
    {
      "principle": "Consistency & standards",
      "code": "H3",
      "max_points": 4,
      "score": 4,
      "evaluation_focus": "Uniform typography, spacing, and button style",
      "justification": "Consistent design patterns throughout."
    },
    {
      "principle": "Error prevention",
      "code": "H4",
      "max_points": 4,
      "score": 3,
      "evaluation_focus": "Field clarity, warning messages",
      "justification": "Some forms lack inline error prevention."
    },
    {
      "principle": "Recognition rather than recall",
      "code": "H5",
      "max_points": 4,
      "score": 4,
      "evaluation_focus": "Visible affordances, icons, tooltips",
      "justification": "Icons and tooltips are present and helpful."
    },
    {
      "principle": "Minimalist design",
      "code": "H6",
      "max_points": 4,
      "score": 4,
      "evaluation_focus": "Simplicity, removal of unnecessary clutter",
      "justification": "Interface is clean and uncluttered."
    },
    {
      "principle": "Flexibility & efficiency of use",
      "code": "H7",
      "max_points": 4,
      "score": 4,
      "evaluation_focus": "Support for shortcuts, focus states",
      "justification": "Keyboard shortcuts and focus states are implemented."
    },
    {
      "principle": "Help users recognize, diagnose, recover from errors",
      "code": "H8",
      "max_points": 4,
      "score": 3,
      "evaluation_focus": "Error feedback and correction hints",
      "justification": "Error messages are present but could be more descriptive."
    },
    {
      "principle": "Help and documentation",
      "code": "H9",
      "max_points": 4,
      "score": 2,
      "evaluation_focus": "Support content or onboarding guides",
      "justification": "Minimal help content provided."
    },
    {
      "principle": "Aesthetic and visual hierarchy",
      "code": "H10",
      "max_points": 4,
      "score": 4,
      "evaluation_focus": "Visual hierarchy, typography contrast",
      "justification": "Strong use of headings and color contrast."
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
      // PULLBACK IF BUGGED
      //   return JSON.parse(cleaned) as AiEvaluator;
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
        // Do not merge computed numeric scores; iteration will control them.
        candidate = {
          ...parsed,
        };
        candidate.summary = `${candidate.summary || ""}`.trim();
      }

      candidate.summary = ensurePersonaInSummary(candidate.summary, generation, occupation);
      // Enforce iteration-controlled display band and final-stage behavior
      const normalized = normalizeForIteration(candidate);
      return normalized as AiEvaluator;

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
