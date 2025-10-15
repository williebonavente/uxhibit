import { Mistral } from "@mistralai/mistralai"
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
import { AccessibilityResult, LayoutResult } from "../uxStandards/heuristicMapping";
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
        id: string; severity: "low" | "medium" | "high";
        message: string;
        suggestion: string
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
        accessibilityResults?: AccessibilityResult[];
        layoutResults?: LayoutResult[];
        textNodes?: any;
    },
    snapshot?: Record<string, unknown>): Promise<AiEvaluator | null> {
    if (!MISTRAL_API_KEY) return null;

    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    const limitedFrames = Array.isArray(context?.layoutResults)
        ? context.layoutResults
        : [];

    console.log("FRAMES SENT TO AI: ", limitedFrames);
    console.log("Snapshot received: ", snapshot);
    console.log("CONTEXT AI PARAMETERS: ", context);
    console.log("HEURISTIC DATA: ",)
    const heuristicMap = heuristics;
    const generation = snapshot?.age as Generation;
    const occupation = snapshot?.occupation as Occupation;


    console.log("Generation: ", generation);
    console.log("Occupation: ", occupation);

    const result = calculateAIWeightedScoreWithHeuristics(heuristicMap, generation, occupation);

    const heuristicScores: HeuristicScores = {
        layout: heuristics.layout ?? 0,
        typography: heuristics.typography ?? 0,
        color: heuristics.color ?? 0,
        accessibility: heuristics.accessibility ?? 0,
        usability: heuristics.usability ?? 0
    };

    const isoScores = mapToIso9241(heuristicScores);

    console.log(result);

    const accessibilityRequirements = getAccessibilityRequirements(generation, occupation);
    console.log("[SCORING RESULTS]: ", result);

    const prompt = `${aiIntroPrompt}
    Context:
    - User scenario: ${userScenarioMap}
    - Business goals: ${businessGoalsMap}
    - Accessibility requirements: ${accessibilityRequirements}
    - Heuristic data: ${JSON.stringify(heuristics, null, 2)}
    - Frame analysis: ${JSON.stringify(limitedFrames, null, 2)}
    - Scoring result: ${JSON.stringify(result, null, 2)}
    - Generational Segment Parameters: ${JSON.stringify(genSegmentParams, null, 2)}
    - Occupational Parameters: ${JSON.stringify(occupationParams, null, 2)}
    ${snapshot ? `- Persona context: ${JSON.stringify(snapshot, null, 2)}` : ""}
    
    Instructions:
    - You are an AI UX Evaluation Engine aligned with ISO 9241-210, WCAG 2.1, and Jakob Nielsen's 10 Usability Heuristics.
    - Your evaluation process must simulate the scoring logic and bias adjustments used in the system's quantitative model.
    - Do not speculate about dynamic feedback or behaviors unless they are visually present.
    - All feedback must reference actual elements, scores, or issues found in the image or metadata.
    - Avoid generic statements about usability or layout unless you can point to a specific visual issue.
    - Only provide feedback that is directly supported by the provided frame analysis, layout results, accessibility results, or text nodes.
    - Do NOT mention missing features, inconsistent layout, lack of hierarchy, or error prevention unless you can reference a specific issue, score, or element in the provided context.
    - For every weakness or issue, specify the frameId and element involved.
    
    **IMPORTANT:** The scoring and feedback MUST be influenced by the persona parameters provided (generation/age and occupation).
    - If a persona is provided, use the matching generational segment parameters and scoring biases below to inform your evaluation and scoring.
    - For example, if the persona is "Gen Z", apply the expectations and scoring biases for Gen Z. If the occupation is "Designer", adjust the scoring and feedback to reflect designer-specific needs and standards.
    
    Follow these steps:
    
    1. **Image and Frame Analysis**
       - Begin by analyzing the provided frame analysis and image context for UX/UI issues, accessibility concerns, and heuristic violations.
       - Reference specific visual elements, layout, color, typography, and accessibility features found in the frames.
    
    2. **Apply Weighted Scoring Logic**
       Use the following computational reference:
       \`\`\`ts
       import { calculateAIWeightedScoreWithHeuristics } from "../core/scoring/calculateAIWeightedScoreWithHeuristics";
       const result = calculateAIWeightedScoreWithHeuristics(heuristics, generation, occupation);
       \`\`\`
       - Compute weighted heuristic category averages.
       - Apply demographic adjustments from GenSegment and Occupation bias justifications.
       - Output category-level scores and overall weighted average.
    
    3. **Reference Demographic and Occupational Biases**
       - Generational Segment Parameters: ${genSegmentParams}
       - Occupational Parameters: ${occupationParams}
       - Bias Justifications:
         - Generational: ${genSegmentSb}
         - Occupational: ${occupationsSb}
    
    4. **Base all explanations and scores on the following evaluation basis:**
       ${evaluatorReturnValues}
    
    5. **Use the provided frame analysis and issues to inform your summary, strengths, weaknesses, and suggestions. Reference specific issues, scores, and text nodes in your feedback. Make recommendations that address the actual problems detected in the metadata.**
    
    6. **Category Score Justifications**
    - For each category score, provide a clear justification explaining why the score was assigned.
    - Reference the actual issues, heuristics, and persona/demographic parameters that influenced the score.
    - You MUST reference the scoring_bias and bias_justification from both ${genSegmentParams} and ${occupationParams} for each category.
    - Use evaluation_focus from both generation and occupation to guide your recommendations.
    - This is required for audit defensibility.
    - For each category_score justification, reference the actual issues, scores, and persona/demographic parameters that influenced the score.
    - Example: If a layout issue is detected, specify the node and the problem.
    - Whenever you reference a design decision, feedback, or recommendation, always mention the relevant generational segment and occupational parameters (e.g., scoring_bias, bias_justification, evaluation_focus) that influenced your reasoning.
    
    7. **Output Requirements**
       You must return ONLY valid JSON in the format below.
       The scores must reflect your quantitative logic and should NEVER be arbitrary.
       Explain in the summary why the score distribution makes sense given the persona and heuristic mapping.
    
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
      "issues": [
        {
          "id": string,
          "heuristic": string,
          "severity": "low|medium|high",
          "message": string,
          "suggestion": string
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
    - Avoid generic feedback. Always reference the actual scores, issues, and text nodes provided.
    - For each category_score justification, reference the actual issues, scores, and persona/demographic parameters that influenced the score.
    - Example: If a layout issue is detected, specify the node and the problem.
    `;

    try {
        const completion = await client.chat.complete({
            model: 'pixtral-12b',
            temperature: 0.1,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text", text: prompt
                        },
                        {
                            type: "image_url", imageUrl: { url: imageUrl }
                        }
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
                        msg.content.find(
                            (p) => p.type === "text" && "text" in p
                        ) as { type: "text"; text: string } | undefined
                    )?.text
                    : undefined;
        if (!contentStr) return null;

        const cleaned = contentStr
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        try {
            return JSON.parse(cleaned) as AiEvaluator;
        } catch {
            const match = contentStr.match(/\{[\s\S]*\}$/);
            if (match) {
                try {
                    return (JSON.parse(match[0]) as AiEvaluator);
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