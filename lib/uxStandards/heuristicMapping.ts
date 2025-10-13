import { HeuristicScores } from "../types/isoTypesHeuristic";

export interface LayoutResult {
  score: number;
}

export interface NormalizedFrame {
  typographyScore: number;
  colorScore: number;
  usabilityScore: number;
}

export interface AccessibilityResult {
  averageContrastScore: number;
}

export interface FigmaContext {
  layoutResults?: LayoutResult[];
  normalizedFrames?: NormalizedFrame[];
  accessibilityResults?: AccessibilityResult[];
}

function average(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export function getHeuristicScores(figmaContext: FigmaContext): HeuristicScores {
  return {
    layout: Array.isArray(figmaContext.layoutResults)
      ? average(figmaContext.layoutResults.map((r) => r.score))
      : 0,
    typography: Array.isArray(figmaContext.normalizedFrames)
      ? average(figmaContext.normalizedFrames.map((f) => f.typographyScore))
      : 0,
    color: Array.isArray(figmaContext.normalizedFrames)
      ? average(figmaContext.normalizedFrames.map((f) => f.colorScore))
      : 0,
    accessibility: Array.isArray(figmaContext.accessibilityResults)
      ? average(figmaContext.accessibilityResults.map((r) => r.averageContrastScore))
      : 0,
    usability: Array.isArray(figmaContext.normalizedFrames)
      ? average(figmaContext.normalizedFrames.map((f) => f.usabilityScore))
      : 0,
  };
}