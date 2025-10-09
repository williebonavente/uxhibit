import { Mistral } from "@mistralai/mistralai"
import { aiIntroPrompt } from "./prompts/aiIntroPrompt/aiIntro";
import { genSegmentParams } from "./prompts/parameters/generations/genSegmentParams";
import { occupationParams } from "./prompts/parameters/occupations/occupationParams";
import { evaluatorReturnValues } from "./prompts/returnFormat/aiFormatUpdate";
import { genSegmentSb } from "./prompts/parameters/scoringBias/genSegmentSb";
import { occupationsSb } from "./prompts/parameters/scoringBias/occupationsSb";
import { calculateAIWeightedScoreWithHeuristics } from "../scoringMethod/calculateAIWeightedScoreWithHeuristics";
import { Generation, Occupation } from "../scoringMethod/evaluationWeights";

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
        accessibility?: number; typography?: number; color?: number;
        layout?: number; hierarchy?: number; usability?: number;
    };
};

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
export async function aiEvaluator(
    imageUrl: string,
    heuristics: Record<string, number>,
    snapshot?: Record<string, unknown>): Promise<AiEvaluator | null> {
    if (!MISTRAL_API_KEY) return null;

    const client = new Mistral({ apiKey: MISTRAL_API_KEY });

    // TODO: currently working on
    //     const prompt = `${aiIntroPrompt}
    //     Context:
    //     - heuristics: ${JSON.stringify(heuristics)}
    //     ${snapshot ? `- persona: ${JSON.stringify(snapshot)}` : ""}

    //     Instructions:
    //     If a persona is provided in the snapshot, use the matching generational segment parameters and scoring 
    //     biases below to inform your evaluation and scoring. For example, if the persona is "Gen Z", 
    //     apply the expectations and scoring biases for Gen Z.

    //     Generational Segment Parameters:${genSegmentParams}
    //     Occupational Parameters: ${occupationParams}
    //     ${evaluatorReturnValues}
    // `;

    const prompt = `
${aiIntroPrompt}

Context:
- Heuristic data: ${JSON.stringify(heuristics, null, 2)}
${snapshot ? `- Persona context: ${JSON.stringify(snapshot, null, 2)}` : ""}

Instructions:
You are an AI UX Evaluation Engine aligned with ISO 9241-210, WCAG 2.1, and Jakob Nielsen's 10 Usability Heuristics.
Your evaluation process must simulate the scoring logic and bias adjustments used in the system's quantitative model.

Follow these steps:

1. **Apply Weighted Scoring Logic**
   Use the following computational reference:
   \`\`\`ts
   import { calculateAIWeightedScoreWithHeuristics } from "../core/scoring/calculateAIWeightedScoreWithHeuristics";
   const result = calculateAIWeightedScoreWithHeuristics(heuristics, generation, occupation);
   \`\`\`
   - Compute weighted heuristic category averages.
   - Apply demographic adjustments from GenSegment and Occupation bias justifications.
   - Output category-level scores and overall weighted average.

2. **Reference Demographic and Occupational Biases**
   - Generational Segment Parameters: ${genSegmentParams}
   - Occupational Parameters: ${occupationParams}
   - Bias Justifications:
     - Generational: ${genSegmentSb}
     - Occupational: ${occupationsSb}

3. **Base all explanations and scores on the following evaluation basis:**
   ${evaluatorReturnValues}

4. **Output Requirements**
   You must return ONLY valid JSON in the format below.
   The scores must reflect your quantitative logic and should NEVER be arbitrary. 
   Explain in the summary why the score distribution makes sense given the persona and heuristic mapping.

Return ONLY valid JSON:
\`\`\`json
{
  "overall_score": number (0-100),
  "summary": string,
  "strengths": string[],
  "weaknesses": string[],
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
`;

    const heuristicMap = heuristics;

    const generation = snapshot?.age as Generation; // "Millennial", "Gen Z", "Gen Alpha"
    const occupation = snapshot?.occupation as Occupation; // "Student", "Developer", etc.


    const result = calculateAIWeightedScoreWithHeuristics(heuristicMap, generation, occupation);

    console.log(result);
    // {

    // Don't overlook the backtick
    // TODO: Currently working on
    try {
        const completion = await client.chat.complete({
            model: 'pixtral-12b',
            temperature: 0.2,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", imageUrl: { url: imageUrl } }
                    ]
                },
            ],
        });
        const msg = completion?.choices?.[0]?.message;
        console.log(msg);
        const contentStr: string | undefined =
            typeof msg?.content === "string"
                ? msg.content
                : Array.isArray(msg?.content)
                    ? (msg.content.find((p: any) => p.type === "text")?.text as string | undefined)
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
        } as AiEvaluator;
    } catch (err: unknown) {
        console.log(err);
        return null;
    }
}