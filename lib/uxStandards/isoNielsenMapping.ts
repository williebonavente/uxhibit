import { HeuristicScores, IsoMapping } from "../types/isoTypesHeuristic";

export function mapToIso9241(scores: HeuristicScores): IsoMapping {
    return {
        suitability: scores.layout,
        selfDescriptiveness: scores.typography,
        conformity: scores.color,
        errorTolerance: scores.accessibility,
        learning: scores.usability,
        individualization: scores.accessibility
    }
}