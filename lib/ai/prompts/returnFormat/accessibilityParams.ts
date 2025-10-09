import { genSegmentParams } from "../parameters/generations/genSegmentParams";
import { occupationParams } from "../parameters/occupations/occupationParams";
import { genSegmentSb } from "../parameters/scoringBias/genSegmentSb";
import { occupationsSb } from "../parameters/scoringBias/occupationsSb";

export const accessibilityParams = `
Consider the following parameters that could affect accessibility scoring:
- Generational segment expectations and scoring biases: ${genSegmentParams}, ${genSegmentSb}
- Occupational segment expectations and scoring biases: ${occupationParams}, ${occupationsSb}
- WCAG 2.1 and heuristic alignment as listed below.
`;