/**
 * Scoring Logic for Nielsen Heuristic #01: Visibility of System Status
 * Context-Aware Version (Adaptive to screen type)
 */

interface Layer {
  name?: string;
}

interface FrameData {
  layers?: Layer[];
  screenType?: string; 
}

interface FeedbackWeight {
  keyword: string;
  weight: number;
  type: "direct" | "indirect";
}

interface ScreenContextRule {
  penalty: number;
  requiredKeywords: string[];
}

export function scoreVisibilityOfSystemStatus(frameData: FrameData): number {
  let score = 50;
  const layers = frameData.layers || [];
  const screenType = frameData.screenType?.toLowerCase() || "generic";

  /**
   * ✅ Feedback elements and their weight.
   */
  const feedbackWeights: FeedbackWeight[] = [
    { keyword: "spinner", weight: 25, type: "direct" },
    { keyword: "loading", weight: 20, type: "direct" },
    { keyword: "notification", weight: 15, type: "direct" },
    { keyword: "toast", weight: 15, type: "direct" },
    { keyword: "alert", weight: 10, type: "direct" },
    { keyword: "progress", weight: 15, type: "direct" },
    { keyword: "status", weight: 10, type: "indirect" },
    { keyword: "skeleton", weight: 10, type: "indirect" },
    { keyword: "placeholder", weight: 8, type: "indirect" },
  ];

  /**
   * 📊 Screen-type-specific rules.
   */
  const screenContextRules: Record<string, ScreenContextRule> = {
    login: {
      penalty: 5,
      requiredKeywords: ["spinner", "loading", "alert"],
    },
    dashboard: {
      penalty: 25,
      requiredKeywords: ["spinner", "loading", "progress", "toast", "notification"],
    },
    landing: {
      penalty: 0,
      requiredKeywords: [],
    },
    checkout: {
      penalty: 20,
      requiredKeywords: ["spinner", "progress", "alert"],
    },
    form: {
      penalty: 15,
      requiredKeywords: ["spinner", "loading", "alert"],
    },
    generic: {
      penalty: 10,
      requiredKeywords: [],
    },
  };

  const rule = screenContextRules[screenType] || screenContextRules.generic;

  let totalBonus = 0;

  for (const feedback of feedbackWeights) {
    const found = layers.some(layer =>
      layer.name?.toLowerCase().includes(feedback.keyword)
    );
    if (found) totalBonus += feedback.weight;
  }

  score += totalBonus;

  // If no relevant indicators for a high-interaction screen, apply context penalty
  const hasRequired = rule.requiredKeywords.some(keyword =>
    layers.some(layer => layer.name?.toLowerCase().includes(keyword))
  );

  if (!hasRequired && rule.penalty > 0) {
    score -= rule.penalty;
  }

  // Clamp final score
  score = Math.max(0, Math.min(100, score));

  return score;
}

/**
 * ✅ Example usage:
 * 
 * const frameData1 = {
 *   screenType: "login",
 *   layers: [{ name: "Main Button" }]
 * };
 * console.log(scoreVisibilityOfSystemStatus(frameData1));
 * // => 45 (no indicator, light penalty for login)
 * 
 * const frameData2 = {
 *   screenType: "dashboard",
 *   layers: [{ name: "Loading Spinner" }, { name: "Toast Notification" }]
 * };
 * console.log(scoreVisibilityOfSystemStatus(frameData2));
 * // => 50 + 20 + 25 + 15 = 100 (clamped)
 * 
 * const frameData3 = {
 *   screenType: "landing",
 *   layers: [{ name: "Hero Section" }]
 * };
 * console.log(scoreVisibilityOfSystemStatus(frameData3));
 * // => 50 (no penalty for landing pages)
 */
