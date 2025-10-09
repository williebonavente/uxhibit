import { heuristicWeights } from "./heuristicWeights";

export interface HeuristicSummaryResult {
    strongest: { id: string; name: string; score: number; interpretation: string };
    weakest: { id: string; name: string; score: number; interpretation: string };
    qualitativeSummary: string;
    detailedFeedback: {
        id: string;
        name: string;
        score: number;
        interpretation: string;
        designImplication: string;
    }[];
}

/**
 * Generates human-readable qualitative feedback from heuristic scores.
 * This interprets numeric ranges in context of usability literature.
 */
type HeuristicId = keyof typeof heuristicWeights.heuristics;

export function interpretHeuristicSummary(heuristicScores: Record<HeuristicId, number>): HeuristicSummaryResult {
    const threshold = {
        excellent: 85,
        good: 70,
        fair: 50,
        poor: 30,
    };

    const feedback: HeuristicSummaryResult["detailedFeedback"] = [];

    for (const [id, score] of Object.entries(heuristicScores)) {
        const heuristic = heuristicWeights.heuristics[id as  HeuristicId];
        let interpretation = "";
        let designImplication = "";

        if (score >= threshold.excellent) {
            interpretation = "Exemplary usability; aligns strongly with established heuristic principles.";
            designImplication = "Maintain this design consistency as a model for other interfaces.";
        } else if (score >= threshold.good) {
            interpretation = "Good usability compliance with minor potential for refinement.";
            designImplication = "Audit for subtle inconsistencies or micro-interactions that could elevate user trust.";
        } else if (score >= threshold.fair) {
            interpretation = "Moderate alignment; may introduce cognitive friction or accessibility gaps.";
            designImplication = "Reassess interaction flows, visual clarity, and feedback timing under WCAG criteria.";
        } else if (score >= threshold.poor) {
            interpretation = "Weak heuristic performance, likely usability issues present.";
            designImplication = "Prioritize redesign—review task affordance, visibility, and feedback cues.";
        } else {
            interpretation = "Critical usability failure; heuristic principle not observed.";
            designImplication = "Immediate corrective action required—violates core UX accessibility standards.";
        }

        feedback.push({
            id,
            name: heuristic.name,
            score,
            interpretation,
            designImplication,
        });
    }

    const sorted = [...feedback].sort((a, b) => b.score - a.score);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    // Generate a concise qualitative summary
    const qualitativeSummary = `
    Your strongest heuristic is #${strongest.id} - ${strongest.name} (${strongest.score.toFixed(1)}), 
    indicating strong alignment with user-centered interaction design and visual clarity.
    However, the weakest area is #${weakest.id} - ${weakest.name} (${weakest.score.toFixed(1)}),
    which suggests potential gaps in ${weakest.name.toLowerCase()}. 
    Consider reinforcing feedback mechanisms, cognitive mapping, or layout consistency to enhance user flow.
  `.trim();

    return {
        strongest,
        weakest,
        qualitativeSummary,
        detailedFeedback: feedback,
    };
}
