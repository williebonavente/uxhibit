import {
    nielsenHeuristicLinks,
    recommendedResources,
    uxLaws,
    wcagHeuristicMapping
} from "../resources/aiResources";

export const evaluationRules = `
    Recommended Resources: 
    ${JSON.stringify(recommendedResources, null, 2)}
    ${JSON.stringify(wcagHeuristicMapping, null, 2)}
    ${JSON.stringify(nielsenHeuristicLinks, null, 2)}
    ${JSON.stringify(uxLaws, null, 2)}
Rules:
- Output valid JSON only, no extra commentary.
- For each issue, always include the "heuristic" field as a two-digit string ("01"-"10") matching Jakob Nielsen's 10 Usability Heuristics.
- For each issue, the "message" field must clearly explain why this heuristic is violated in this specific UI/frame.
- Be specific and actionable in your feedback.
- In the "summary", explicitly mention how the design meets or misses expectations of the persona/demographics (e.g., Gen Z prefers vibrant colors, developers need clear dashboards).
- If a category does not apply, set its score to 0.
- For each issue, the "heuristic" field must match one of the following:
  "01" - Visibility of System Status
  "02" - Match Between System and the Real World
  "03" - User Control and Freedom
  "04" - Consistency and Standards
  "05" - Error Prevention
  "06" - Recognition Rather than Recall
  "07" - Flexibility and Efficiency of Use
  "08" - Aesthetic and Minimalist Design
  "09" - Help Users Recognize, Diagnose, and Recover from Errors
  "10" - Help and Documentation
- For each identified weakness or issue, recommend at least one relevant resources coming Recommended Resources from that a student should review to improve their understanding. Include the resource's title, URL, and a brief description. Link each resource to the corresponding issue using "issue_id".
`;