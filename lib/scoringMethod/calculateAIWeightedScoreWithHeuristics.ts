import {
  evaluationWeights,
  Category,
  Generation,
  Occupation
} from "./evaluationWeights";

/**
 * Compute final AI UX score with heuristic integration and personalized demographic adjustments.
 * Fully aligned with WCAG 2.1 + Jakob Nielsen’s 10 Usability Heuristics.
 */
export function calculateAIWeightedScoreWithHeuristics(
  heuristicMap: Record<string, number>,
  generation: Generation,
  occupation: Occupation,
) {
  const category_scores: Record<Category, number> = {
    accessibility: 0,
    typography: 0,
    color: 0,
    layout: 0,
    hierarchy: 0,
    usability: 0,
  };

  // Only iterate over valid categories
  const validCategories: Category[] = [
    "accessibility",
    "typography",
    "color",
    "layout",
    "hierarchy",
    "usability",
  ];

  for (const category of validCategories) {
    const data = evaluationWeights.categories[category];
    const relevantHeuristics = data.heuristics.map((h) => heuristicMap[h] ?? 0);
    const avgHeuristicScore =
      relevantHeuristics.reduce((a, b) => a + b, 0) / (relevantHeuristics.length || 1);

    // Fetch contextual adjustments (biases)
    const genAdj = Number(evaluationWeights.genSegmentAdjustments[generation]?.[category] ?? 0);
    const occAdj = Number(evaluationWeights.occupationAdjustments[occupation]?.[category] ?? 0);

    // Compute category score with personalized bias
    const raw = avgHeuristicScore * data.weight;
    const adjusted = raw + raw * (genAdj + occAdj);

    category_scores[category] = Number(Math.min(100, Math.max(0, adjusted)).toFixed(2));
  }

  // --- Compute overall weighted average ---
  const overall_score =
    validCategories.reduce(
      (acc, cat) => acc + category_scores[cat] * evaluationWeights.categories[cat].weight,
      0
    ) /
    validCategories.map((c) => evaluationWeights.categories[c].weight).reduce((a, b) => a + b, 0);

  // --- Generate interpretive qualitative insights ---
  const strongest = validCategories
    .map((cat) => [cat, category_scores[cat]] as [Category, number])
    .sort((a, b) => b[1] - a[1])[0];
  const weakest = validCategories
    .map((cat) => [cat, category_scores[cat]] as [Category, number])
    .sort((a, b) => a[1] - b[1])[0];

  const interpretation = {
    summary: `This interface demonstrates strong adherence to ${strongest[0]} principles while needing improvement in ${weakest[0]}.`,
    strongest_category: strongest[0],
    weakest_category: weakest[0],
    generation_bias_applied: generation,
    occupation_bias_applied: occupation,
    overall_compliance_level:
      overall_score >= 90
        ? "Exemplary (Highly usable and accessible)"
        : overall_score >= 75
          ? "Strong (Minor usability improvements suggested)"
          : overall_score >= 60
            ? "Moderate (Several heuristic issues visible)"
            : "Weak (Significant usability and accessibility flaws)",
  };

  return {
    overall_score: Number(overall_score.toFixed(2)),
    category_scores,
    interpretation,
  };
}