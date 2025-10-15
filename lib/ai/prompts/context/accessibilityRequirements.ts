import { Generation, Occupation } from "@/lib/scoringMethod/evaluationWeights";

interface AccessibilityPrompt {
    generation: Generation;
    occupation: Occupation;
    accessibilityStandards: string[];
    keyConsiderations: string[];
    interactionFocus: string[];
    toneGuidance: string;
}

const accessibilityPromptMap: Record<Generation, Record<Occupation, AccessibilityPrompt>> = {
    "Gen Z": {
        Student: {
            generation: "Gen Z",
            occupation: "Student",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["mobile-first accessibility", "clear learning feedback", "intuitive navigation"],
            interactionFocus: ["touch", "keyboard", "mobile-responsive UI"],
            toneGuidance: "Use a direct and youthful tone. Emphasize simplicity and clarity."
        },
        Freelancer: {
            generation: "Gen Z",
            occupation: "Freelancer",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["remote tool compatibility", "adaptive layouts", "cross-platform accessibility"],
            interactionFocus: ["desktop", "mobile", "collaborative tools"],
            toneGuidance: "Keep it concise and task-focused. Prioritize productivity."
        },
        Designer: {
            generation: "Gen Z",
            occupation: "Designer",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["visual clarity", "color contrast", "creative flexibility"],
            interactionFocus: ["high-fidelity visuals", "customizable UI", "contrast control"],
            toneGuidance: "Encourage creativity with accessible design rules."
        },
        Developer: {
            generation: "Gen Z",
            occupation: "Developer",
            accessibilityStandards: ["WCAG 2.1 AA", "WAI-ARIA"],
            keyConsiderations: ["robust ARIA roles", "keyboard navigation", "semantic structure"],
            interactionFocus: ["code accessibility", "dev tools"],
            toneGuidance: "Use technical and precise language."
        },
        Educator: {
            generation: "Gen Z",
            occupation: "Educator",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["screen reader support", "accessible instructional materials"],
            interactionFocus: ["text-to-speech", "captioning", "alt text"],
            toneGuidance: "Maintain a supportive and clear instructional tone."
        }
    },
    "Millennial": {
        Student: {
            generation: "Millennial",
            occupation: "Student",
            accessibilityStandards: ["WCAG 2.1 AA", "ADA"],
            keyConsiderations: ["responsive design", "multi-device support"],
            interactionFocus: ["desktop", "mobile"],
            toneGuidance: "Professional, clear, and structured."
        },
        Freelancer: {
            generation: "Millennial",
            occupation: "Freelancer",
            accessibilityStandards: ["WCAG 2.1 AA", "Section 508"],
            keyConsiderations: ["accessible collaboration", "tool interoperability"],
            interactionFocus: ["desktop", "remote apps"],
            toneGuidance: "Task-oriented and efficient."
        },
        Designer: {
            generation: "Millennial",
            occupation: "Designer",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["strong color contrast", "customizable components"],
            interactionFocus: ["layout control", "UI consistency"],
            toneGuidance: "Design-savvy, balanced."
        },
        Developer: {
            generation: "Millennial",
            occupation: "Developer",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["semantic HTML", "accessible forms"],
            interactionFocus: ["code patterns", "cross-browser behavior"],
            toneGuidance: "Technical and clean."
        },
        Educator: {
            generation: "Millennial",
            occupation: "Educator",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["accessible documents", "multimedia captioning"],
            interactionFocus: ["PDF accessibility", "closed caption"],
            toneGuidance: "Clear and authoritative."
        }
    },
    "Gen Alpha": {
        Student: {
            generation: "Gen Alpha",
            occupation: "Student",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["voice interaction", "touch-first design"],
            interactionFocus: ["voice UI", "gesture control"],
            toneGuidance: "Playful and intuitive."
        },
        Freelancer: {
            generation: "Gen Alpha",
            occupation: "Freelancer",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["adaptive interfaces", "emerging devices"],
            interactionFocus: ["wearables", "immersive UI"],
            toneGuidance: "Futuristic and innovative."
        },
        Designer: {
            generation: "Gen Alpha",
            occupation: "Designer",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["playful accessibility patterns", "intuitive interactions"],
            interactionFocus: ["AR/VR UI", "touch"],
            toneGuidance: "Creative and open."
        },
        Developer: {
            generation: "Gen Alpha",
            occupation: "Developer",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["new input support", "device diversity"],
            interactionFocus: ["voice", "gesture", "spatial UI"],
            toneGuidance: "Forward-thinking and technical."
        },
        Educator: {
            generation: "Gen Alpha",
            occupation: "Educator",
            accessibilityStandards: ["WCAG 2.1 AA"],
            keyConsiderations: ["gamified accessibility", "interactive learning"],
            interactionFocus: ["game-based UI", "voice UI"],
            toneGuidance: "Engaging and story-driven."
        }
    }
};


export function getAccessibilityRequirements(generation: Generation, occupation: Occupation): string {
    const prompt = accessibilityPromptMap[generation]?.[occupation];
    if (!prompt) return "Must meet WCAG 2.1 AA standards";
    return [
        `Standards: ${prompt.accessibilityStandards.join(", ")}`,
        `Key considerations: ${prompt.keyConsiderations.join(", ")}`,
        `Interaction focus: ${prompt.interactionFocus.join(", ")}`,
        `Tone: ${prompt.toneGuidance}`
    ].join("\n");
}