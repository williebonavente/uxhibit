import { genSegmentParams } from "../parameters/generations/genSegmentParams";
import { occupationParams } from "../parameters/occupations/occupationParams";
import { genSegmentSb } from "../parameters/scoringBias/genSegmentSb";
import { occupationsSb } from "../parameters/scoringBias/occupationsSb";
import { evaluationRules } from "../promptRules/aiRules";
import { nielsenHeuristicLinks, recommendedResources, uxLaws, wcagHeuristicMapping } from "../resources/aiResources";
import { accessibilityParams } from "./accessibilityParams";
export const evaluatorReturnValues = `{
    "scoring_basis": {
        "standards": ["WCAG 2.1", "Jakob Nielsen's 10 Usability Heuristics"],
        "scoring_range": "0-100",
        "scoring_logic": {
            "0": "Critical usability failure — violates both WCAG and heuristic principle.",
            "25": "Partial compliance, user struggle likely.",
            "50": "Moderate compliance — acceptable but improvement needed.",
            "75": "Strong compliance — meets most criteria with minor issues.",
            "100": "Full compliance — exemplary accessibility and usability."
        },
        "generational_segments": {
            "parameters": ${genSegmentParams},
            "scoring_bias_justifications": ${genSegmentSb}
        },
         "occupational_parameter": {
            "parameters": ${occupationParams},
            "scoring_bias_justifications": ${occupationsSb}
        },
    },

    "category_basis": {
        "accessibility": {
            "definition": "Measures the system's conformance to WCAG 2.1 principles (Perceivable, Operable, Understandable, Robust).",
            "wcag_reference": ["1.1.1 Text Alternatives", "1.4.3 Contrast (Minimum)", "2.1.1 Keyboard", "4.1.2 Name, Role, Value"],
            "heuristic_alignment": ["#01 Visibility of System Status", "#05 Error Prevention", "#10 Help and Documentation"],
            "parameters": ${accessibilityParams}
        },
        "typography": {
            "definition": "Evaluates readability, consistency, and text hierarchy in accordance with perceptual clarity and cognitive load reduction.",
            "wcag_reference": ["1.4.8 Visual Presentation", "1.4.12 Text Spacing"],
            "heuristic_alignment": ["#02 Match Between System and the Real World", "#04 Consistency and Standards"],
            "parameters": ${accessibilityParams}
        },
        "color": {
            "definition": "Assesses color contrast, meaning clarity, and visual comfort for accessibility and emphasis.",
            "wcag_reference": ["1.4.1 Use of Color", "1.4.3 Contrast (Minimum)", "1.4.11 Non-text Contrast"],
            "heuristic_alignment": ["#06 Recognition Rather Than Recall", "#08 Aesthetic and Minimalist Design"],
            "parameters": ${accessibilityParams}
        },
        "layout": {
            "definition": "Measures visual organization, spacing, and navigability for efficient interaction and task completion.",
            "wcag_reference": ["1.3.2 Meaningful Sequence", "2.4.3 Focus Order", "2.4.6 Headings and Labels"],
            "heuristic_alignment": ["#03 User Control and Freedom", "#07 Flexibility and Efficiency of Use"],
            "parameters": ${accessibilityParams}
        },
        "hierarchy": {
            "definition": "Evaluates the information architecture, visual priority, and structural relationships within the UI.",
            "wcag_reference": ["1.3.1 Info and Relationships", "2.4.10 Section Headings"],
            "heuristic_alignment": ["#04 Consistency and Standards", "#08 Aesthetic and Minimalist Design"],
            "parameters": ${accessibilityParams}
        },
        "usability": {
            "definition": "Reflects the overall intuitiveness, error prevention, efficiency, and satisfaction based on heuristic compliance.",
            "wcag_reference": ["2.4.7 Focus Visible", "3.3.1 Error Identification", "3.3.3 Error Suggestion"],
            "heuristic_alignment": ["#05 Error Prevention", "#09 Help Users Recognize, Diagnose, and Recover from Errors"],
            "parameters": ${accessibilityParams}
        }
    },

    Recommended Resources: 
    ${JSON.stringify(recommendedResources, null, 2)}
    ${JSON.stringify(wcagHeuristicMapping, null, 2)}
    ${JSON.stringify(nielsenHeuristicLinks, null, 2)}
    ${JSON.stringify(uxLaws, null, 2)}

    Return ONLY valid JSON in the following format:
    {
        "overall_score": number (0-100),
        "summary": string, 
        "strengths": string[],
        "weaknesses": string[],
        "issues": [
        { 
         "id": string, 
         "heuristic": string (e.g. "01" for Visibility of System Status, "02" for Match Between System and the Real World, ... "10" for Help and Documentation),
         "severity": "low|medium|high", 
          "message": string, // This must clearly explain why the heuristic is violated in this UI/frame 
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
            "issue_id": string, // must match the id of the weakness/issue 
            "title": string,
            "url": string, // the url should be coming only from the Recommended resources
            "description": string
        }
      ]    
    }
    ${evaluationRules}
}`
