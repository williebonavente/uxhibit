import { Generation, Occupation } from "@/lib/scoringMethod/evaluationWeights";

export type CategoryKey =
  | "color"
  | "layout"
  | "hierarchy"
  | "usability"
  | "typography"
  | "accessibility";

export type ScoringFocus =
  | "balance"        // neutral
  | "accessibility"  // compliance-first
  | "usability"      // flow-first
  | "readability"    // content-first
  | "aesthetics"     // visual-first
  | "conversion";    // hierarchy/CTA-first

export type Strictness = "lenient" | "balanced" | "strict";

export interface ScoringParams {
  generation?: Generation;
  occupation?: Occupation;
  focus?: ScoringFocus;       // selected “scoring matter” from UI
  device?: "mobile" | "desktop";
  strictness?: Strictness;    // optional QA strictness
}

export interface BiasProfile {
  categoryWeights: Record<CategoryKey, number>; // normalized to sum=1
  // Optional knobs you can use in your pipeline for issues/heuristics blending
  severityMultipliers: {
    accessibility: number; // multiplies accessibility-related issue impact
    usability: number;
    content: number;       // copy/readability issues
  };
  alpha?: number; // optional blend factor if you combine heuristics with categories
}

const BASE_WEIGHTS: Record<CategoryKey, number> = {
  color: 1,
  layout: 1,
  hierarchy: 1,
  usability: 1,
  typography: 1,
  accessibility: 1,
};

// Focus presets (strongest signal)
const FOCUS_WEIGHTS: Record<ScoringFocus, Partial<Record<CategoryKey, number>>> = {
  balance: {},
  accessibility: { accessibility: 2.0, usability: 1.2, typography: 1.1 },
  usability: { usability: 1.8, hierarchy: 1.2, layout: 1.1 },
  readability: { typography: 1.7, hierarchy: 1.2, color: 0.9 },
  aesthetics: { color: 1.6, typography: 1.3, layout: 1.1 },
  conversion: { hierarchy: 1.7, layout: 1.2, color: 1.1 },
};

// Generation deltas (light nudge)
const GEN_DELTAS: Partial<Record<Generation, Partial<Record<CategoryKey, number>>>> = {
  "Gen Z": { color: 0.15, hierarchy: 0.1 },
  Millennial: { usability: 0.15, typography: 0.1 },
  "Gen Alpha": { hierarchy: 0.1, color: 0.1, layout: 0.05 },
};

// Occupation deltas (light nudge)
const OCC_DELTA: Partial<Record<Occupation, Partial<Record<CategoryKey, number>>>> = {
  Developer: { accessibility: 0.25, usability: 0.1 },
  Designer: { color: 0.2, typography: 0.15 },
  Educator: { readability: 0 } as any, // no direct key; handled below by typography/hierarchy
  Freelancer: { usability: 0.1, layout: 0.05 },
  Student: { typography: 0.1, usability: 0.05 },
};

// Severity multipliers presets by focus (optional)
const FOCUS_SEVERITY: Record<ScoringFocus, BiasProfile["severityMultipliers"]> = {
  balance: { accessibility: 1, usability: 1, content: 1 },
  accessibility: { accessibility: 1.6, usability: 1.1, content: 1.1 },
  usability: { accessibility: 1.1, usability: 1.5, content: 1.0 },
  readability: { accessibility: 1.1, usability: 1.0, content: 1.5 },
  aesthetics: { accessibility: 1.0, usability: 1.0, content: 1.0 },
  conversion: { accessibility: 1.0, usability: 1.3, content: 1.1 },
};

// Strictness affects alpha (if you blend heuristics + categories elsewhere)
const STRICT_ALPHA: Record<Strictness, number> = {
  lenient: 0.35,
  balanced: 0.5,
  strict: 0.7,
};

function clamp(v: number, min = 0.2, max = 3): number {
  return Math.max(min, Math.min(max, v));
}

function normalizeWeights(w: Record<CategoryKey, number>): Record<CategoryKey, number> {
  const sum = (Object.values(w) as number[]).reduce((a, b) => a + b, 0) || 1;
  const out = { ...w } as Record<CategoryKey, number>;
  (Object.keys(out) as CategoryKey[]).forEach((k) => (out[k] = out[k] / sum));
  return out;
}

/**
 * Build a bias profile from selected parameters.
 */
export function getScoringBiasProfile(params: ScoringParams = {}): BiasProfile {
  const { generation, occupation, focus = "balance", strictness = "balanced" } = params;

  // 1) Start with base weights
  const w: Record<CategoryKey, number> = { ...BASE_WEIGHTS };

  // 2) Apply focus preset
  const focusPreset = FOCUS_WEIGHTS[focus] || {};
  (Object.keys(focusPreset) as CategoryKey[]).forEach((k) => {
    w[k] = clamp(w[k] * (focusPreset[k] as number));
  });

  // 3) Apply generation delta
  if (generation && GEN_DELTAS[generation]) {
    const g = GEN_DELTAS[generation]!;
    (Object.keys(g) as CategoryKey[]).forEach((k) => {
      w[k] = clamp(w[k] + (g[k] as number));
    });
  }

  // 4) Apply occupation delta
  if (occupation && OCC_DELTA[occupation]) {
    const o = OCC_DELTA[occupation]!;
    (Object.keys(o) as CategoryKey[]).forEach((k) => {
      // map “Educator.readability” notion to typography/hierarchy
      if (k === ("readability" as any)) return;
      w[k] = clamp(w[k] + (o[k] as number));
    });
    if (occupation === "Educator") {
      w.typography = clamp(w.typography + 0.15);
      w.hierarchy = clamp(w.hierarchy + 0.1);
    }
  }

  // 5) Optional device nudge (mobile emphasizes usability/typography)
  if (params.device === "mobile") {
    w.usability = clamp(w.usability + 0.1);
    w.typography = clamp(w.typography + 0.1);
    w.layout = clamp(w.layout + 0.05);
  }

  const categoryWeights = normalizeWeights(w);
  const severityMultipliers = FOCUS_SEVERITY[focus] || FOCUS_SEVERITY.balance;
  const alpha = STRICT_ALPHA[strictness];

  return { categoryWeights, severityMultipliers, alpha };
}

/**
 * Compute a weighted overall score from category scores.
 * Works with any numeric scale; result is normalized by weight sum.
 */
export function computeWeightedOverall(
  categoryScores: Partial<Record<CategoryKey, number>>,
  weights: Record<CategoryKey, number>
): number {
  let num = 0;
  let den = 0;
  (Object.keys(weights) as CategoryKey[]).forEach((k) => {
    if (Number.isFinite(categoryScores[k] as number)) {
      const v = categoryScores[k] as number;
      const w = weights[k];
      num += v * w;
      den += w;
    }
  });
  return den > 0 ? num / den : 0;
}

export function amplifyIssueSeverity<T extends { severity?: string; category?: string }>(
  issues: T[],
  multipliers: BiasProfile["severityMultipliers"]
): T[] {
  const factorFor = (issue: T) => {
    const sev = (issue.severity || "").toLowerCase();
    const cat = (issue.category || "").toLowerCase();
    const base =
      cat.includes("access") ? multipliers.accessibility :
      cat.includes("usab") ? multipliers.usability :
      cat.includes("content") || cat.includes("read") ? multipliers.content :
      1;

    // Optional: slightly boost by severity label
    const sevBoost = sev.startsWith("high") ? 1.2 : sev.startsWith("medium") ? 1.1 : 1.0;
    return base * sevBoost;
  };

  return issues.map((it) => ({ ...it, _multiplier: factorFor(it) } as T & any));
}