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
  _issues_amplified?: (AiEvaluator["issues"][number] & {
    _multiplier: number;
  })[];
};