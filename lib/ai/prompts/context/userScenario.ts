import { Generation, Occupation } from "@/lib/scoringMethod/evaluationWeights";

interface PersonaUserScenario {
    generation: Generation;
    occupation: Occupation;
    context: string;
    goal: string;
    motivations: string[];
    painPoints: string[];
    accessibilityNeeds: string[];
    expectedInteractions: string[];
    toneGuidance: string;
    uxCharacteristics?: string[];
}

export const userScenarioMap: Record<Generation, Record<Occupation, PersonaUserScenario>> = {
    "Gen Z": {
        Student: {
            generation: "Gen Z",
            occupation: "Student",
            context: "A college student is using a mobile banking app to transfer allowance from their savings account to their daily budget account.",
            goal: "Complete the transfer in a few taps with clear confirmation.",
            motivations: [
                "Needs quick access to lunch money or daily expenses",
                "Prefers minimal steps and visual clarity",
                "Wants immediate feedback for trust"
            ],
            painPoints: [
                "Confusing navigation or hidden transfer options",
                "Slow transaction confirmation",
                "Lack of clear error messages"
            ],
            accessibilityNeeds: [
                "High contrast mode",
                "Large touch targets",
                "Clear success indicators (text + icon)"
            ],
            expectedInteractions: [
                "Tap transfer button on home dashboard",
                "Use biometric authentication",
                "Receive immediate push notification confirmation"
            ],
            toneGuidance: "Use direct, friendly, and supportive language.",
            uxCharacteristics: [
                "Mobile-first behavior",
                "Prefers minimal UI with clear CTA",
                "Strong reliance on biometric authentication",
                "Expects fast confirmation feedback",
                "Favors trust signals like checkmarks, animations, and push notifications"
            ]
        },
        Freelancer: {
            generation: "Gen Z",
            occupation: "Freelancer",
            context: "A freelance designer is transferring client payments from their business account to a personal account.",
            goal: "Ensure fast, reliable transfer with clear transaction breakdown.",
            motivations: [
                "Keep business and personal funds organized",
                "Maintain cash flow visibility",
                "Avoid delays or extra steps"
            ],
            painPoints: [
                "Ambiguous transaction status",
                "Complicated account selection",
                "Hidden fees or unclear transfer limits"
            ],
            accessibilityNeeds: [
                "Accessible text and contrast",
                "Progressive disclosure of advanced options",
                "Keyboard shortcuts / voice control support"
            ],
            expectedInteractions: [
                "Select source and destination accounts from dropdown",
                "Set transfer amount and confirm with PIN or biometric",
                "View confirmation and download receipt"
            ],
            toneGuidance: "Use concise, professional, and confidence-inspiring language.",
            uxCharacteristics: [
                "Prefers visual clarity and speed",
                "Values transaction breakdown transparency",
                "Leans on biometric/PIN authentication",
                "Wants downloadable or shareable confirmations",
                "Low tolerance for extra steps or friction"
            ]
        },
        Designer: {
            generation: "Gen Z",
            occupation: "Designer",
            context: "A UX designer is transferring funds to a travel savings account for upcoming projects abroad.",
            goal: "Execute the transfer smoothly with a clean, predictable UI.",
            motivations: [
                "Prefers aesthetic, minimal interfaces",
                "Wants confidence in transaction status",
                "Appreciates customization"
            ],
            painPoints: [
                "Cluttered UI with too many options",
                "Poor feedback on transfer success",
                "Unintuitive iconography"
            ],
            accessibilityNeeds: [
                "High-contrast mode toggle",
                "Clear micro-interactions",
                "Accessible color choices"
            ],
            expectedInteractions: [
                "Swipe or tap on quick action",
                "Authenticate securely",
                "Receive a success state with visual feedback"
            ],
            toneGuidance: "Use clean, calm, and visually oriented language.",
            uxCharacteristics: [
                "Aesthetic sensitivity",
                "Prefers micro-interactions and motion cues",
                "Values customizable UI elements",
                "Relies on smooth transitions and clean layouts",
                "Low tolerance for clutter or ambiguity"
            ]
        },
        Developer: {
            generation: "Gen Z",
            occupation: "Developer",
            context: "A software developer is transferring funds from their payroll account to a high-interest savings account.",
            goal: "Perform a precise, secure transfer with zero ambiguity.",
            motivations: [
                "Prefers clarity and control over the transaction flow",
                "Wants detailed transaction logs",
                "Expects fast and reliable execution"
            ],
            painPoints: [
                "Unclear system states or errors",
                "Lack of advanced options (e.g., scheduled transfers)",
                "Slow authentication"
            ],
            accessibilityNeeds: [
                "Keyboard navigation support",
                "Clear error messages with codes",
                "Accessible form labels"
            ],
            expectedInteractions: [
                "Open transfer module directly",
                "Input amount precisely",
                "Authenticate with PIN or biometric",
                "View detailed transaction summary"
            ],
            toneGuidance: "Use technical, precise language.",
            uxCharacteristics: [
                "Prefers transparency and control",
                "Needs structured flows with minimal UI noise",
                "Expects accurate, detailed feedback",
                "Comfortable with advanced features and shortcuts",
                "High expectation for performance and error clarity"
            ]
        },
        Educator: {
            generation: "Gen Z",
            occupation: "Educator",
            context: "A young teacher is transferring money to their utilities account for monthly bills.",
            goal: "Finish the transaction smoothly and receive confirmation.",
            motivations: [
                "Values reliability and security",
                "Prefers clear steps and progress indicators",
                "Wants peace of mind after transfer"
            ],
            painPoints: [
                "Unclear step indicators",
                "Lack of transaction status visibility",
                "Accessibility barriers with touch"
            ],
            accessibilityNeeds: [
                "Screen reader support",
                "Accessible labeling",
                "Simple error recovery"
            ],
            expectedInteractions: [
                "Tap bill payment shortcut",
                "Authenticate via fingerprint",
                "Get confirmation and receipt"
            ],
            toneGuidance: "Use instructional and reassuring language.",
            uxCharacteristics: [
                "Prefers structured step-by-step flows",
                "Values confirmation and reassurance",
                "Needs trust signals and error recovery",
                "Moderate reliance on accessibility features",
                "Prioritizes reliability over speed"
            ]
        }
    },
    Millennial: {
        Student: {
            generation: "Millennial",
            occupation: "Student",
            context: "A graduate student is transferring scholarship funds from their school account to their personal spending account.",
            goal: "Ensure secure transfer with clear visibility of each step.",
            motivations: [
                "Wants to manage scholarship money efficiently",
                "Prefers transparency and security during financial actions",
                "Values control over their transaction flow"
            ],
            painPoints: [
                "Unclear step indicators",
                "Hidden transaction history",
                "Lack of detailed confirmation messages"
            ],
            accessibilityNeeds: [
                "Readable typography",
                "Clear progress indicators",
                "Error prevention and undo option"
            ],
            expectedInteractions: [
                "Navigate through structured transfer flow",
                "Authenticate via PIN or password",
                "View a transaction receipt and history log"
            ],
            toneGuidance: "Use informative, structured, and trustworthy language.",
            uxCharacteristics: [
                "Prefers structured flows over minimal UIs",
                "Values security and transaction visibility",
                "Expects confirmation screens",
                "Wants responsive and stable app behavior"
            ]
        },
        Freelancer: {
            generation: "Millennial",
            occupation: "Freelancer",
            context: "A freelance consultant is transferring payment from a client account to their savings account after receiving project fees.",
            goal: "Maintain accurate transaction records for financial tracking.",
            motivations: [
                "Wants clear logs for taxes and budgeting",
                "Values reliability and clarity",
                "Expects transparent fees"
            ],
            painPoints: [
                "Hidden fees or unclear breakdowns",
                "Poor transaction history visibility",
                "Lack of filtering or export options"
            ],
            accessibilityNeeds: [
                "Responsive layouts on multiple devices",
                "Clear table views of transactions",
                "Accessible labeling"
            ],
            expectedInteractions: [
                "Select business account",
                "Authenticate securely",
                "Download or export transaction summary"
            ],
            toneGuidance: "Use precise, professional, and trustworthy language.",
            uxCharacteristics: [
                "Emphasis on transaction details",
                "Cross-platform consistency",
                "Requires reliable confirmation and logs",
                "Values auditability"
            ]
        },
        Designer: {
            generation: "Millennial",
            occupation: "Designer",
            context: "A UI/UX designer is moving funds to a project savings account for an upcoming freelance collaboration.",
            goal: "Easily categorize transactions and confirm transfer reliability.",
            motivations: [
                "Wants a smooth, predictable transfer process",
                "Values design clarity",
                "Expects structured flow"
            ],
            painPoints: [
                "Overly cluttered UI",
                "Slow transition between steps",
                "Unclear button states"
            ],
            accessibilityNeeds: [
                "Stable navigation hierarchy",
                "Accessible and consistent icons",
                "Clear feedback messages"
            ],
            expectedInteractions: [
                "Go through guided transfer steps",
                "Authenticate with PIN/password",
                "Review transaction summary"
            ],
            toneGuidance: "Use clear, structured, and reassuring language.",
            uxCharacteristics: [
                "Prefers consistency and clarity",
                "Relies on feedback for assurance",
                "Favors progressive disclosure over minimalism"
            ]
        },
        Developer: {
            generation: "Millennial",
            occupation: "Developer",
            context: "A backend developer is transferring part of their salary to a joint household account.",
            goal: "Execute a reliable, traceable transfer with optional scheduling.",
            motivations: [
                "Prefers predictable systems",
                "Wants scheduling and automation",
                "Values detailed status logs"
            ],
            painPoints: [
                "Lack of scheduling features",
                "Poor error handling",
                "Unclear transaction state"
            ],
            accessibilityNeeds: [
                "Keyboard navigation",
                "Detailed transaction logs",
                "Configurable notifications"
            ],
            expectedInteractions: [
                "Open transfer settings",
                "Set amount and schedule",
                "Receive email or push notification confirmation"
            ],
            toneGuidance: "Use technical, structured language.",
            uxCharacteristics: [
                "Prefers control over automation",
                "Wants traceability and logs",
                "Security and reliability prioritized"
            ]
        },
        Educator: {
            generation: "Millennial",
            occupation: "Educator",
            context: "A teacher is transferring funds to their utilities account to pay monthly bills.",
            goal: "Finish the transaction securely with clear proof of payment.",
            motivations: [
                "Values reliability and trust",
                "Prefers predictable steps",
                "Wants peace of mind after transaction"
            ],
            painPoints: [
                "Lack of detailed confirmation",
                "Unclear status tracking",
                "Slow transaction speed"
            ],
            accessibilityNeeds: [
                "Readable labels and buttons",
                "Screen reader support",
                "Step-by-step flow"
            ],
            expectedInteractions: [
                "Select payee",
                "Authenticate via PIN",
                "Receive detailed receipt"
            ],
            toneGuidance: "Use instructional and professional language.",
            uxCharacteristics: [
                "Security-first behavior",
                "Prefers clarity over speed",
                "Values transaction proof"
            ]
        }
    },
    "Gen Alpha": {
        Student: {
            generation: "Gen Alpha",
            occupation: "Student",
            context: "A high school student is transferring funds from a prepaid account to a school supplies fund under parental supervision.",
            goal: "Make the transfer quickly with guidance and instant confirmation.",
            motivations: [
                "Wants simple, guided interactions",
                "Relies on visual indicators",
                "Needs assurance at every step"
            ],
            painPoints: [
                "Complicated interfaces",
                "Lack of visual feedback",
                "Confusing terminology"
            ],
            accessibilityNeeds: [
                "Clear icons and labels",
                "Simple, gamified interactions",
                "Assistive text or voice cues"
            ],
            expectedInteractions: [
                "Tap clear visual buttons",
                "Authenticate with parental PIN or biometric",
                "Receive animated success feedback"
            ],
            toneGuidance: "Use friendly, approachable, and encouraging language.",
            uxCharacteristics: [
                "Strong reliance on visuals",
                "Prefers simplified guided flows",
                "Needs confidence reinforcement",
                "Low tolerance for friction"
            ]
        },
        Freelancer: {
            generation: "Gen Alpha",
            occupation: "Freelancer",
            context: "A young content creator is transferring income from their digital wallet to a savings account.",
            goal: "Make a fast, easy transfer with animated feedback.",
            motivations: [
                "Prefers fun and fast interactions",
                "Values instant feedback",
                "Wants to feel secure without too many steps"
            ],
            painPoints: [
                "Complex authentication flow",
                "Lack of engaging feedback",
                "Confusing error handling"
            ],
            accessibilityNeeds: [
                "Big, tappable buttons",
                "Assistive voice and tooltip guides",
                "Visual success states"
            ],
            expectedInteractions: [
                "Tap transfer shortcut",
                "Authenticate with face or touch",
                "Receive playful confirmation animation"
            ],
            toneGuidance: "Use lively, friendly language.",
            uxCharacteristics: [
                "Visual-first interaction",
                "Prefers simplicity",
                "Engagement and delight matter",
                "Short attention span tolerance"
            ]
        },
        Designer: {
            generation: "Gen Alpha",
            occupation: "Designer",
            context: "A young aspiring designer is transferring money to buy creative tools.",
            goal: "Complete transfer smoothly with minimal text and visual clarity.",
            motivations: [
                "Prefers animated UI",
                "Enjoys clean design with clear steps",
                "Wants gamified interaction"
            ],
            painPoints: [
                "Too many text-based instructions",
                "Unclear iconography",
                "Slow loading states"
            ],
            accessibilityNeeds: [
                "Rich visual feedback",
                "Consistent iconography",
                "Voice guidance"
            ],
            expectedInteractions: [
                "Tap animated transfer button",
                "Authenticate with a single action",
                "Receive confetti-like feedback animation"
            ],
            toneGuidance: "Use short, visual-centric language.",
            uxCharacteristics: [
                "Gamified UX preference",
                "Reliance on visual storytelling",
                "Speed over depth"
            ]
        },
        Developer: {
            generation: "Gen Alpha",
            occupation: "Developer",
            context: "A young coding enthusiast is transferring funds to purchase online learning tools.",
            goal: "Easily and confidently finish the transfer with minimal reading.",
            motivations: [
                "Wants an interactive experience",
                "Prefers low-text, high-visual UI",
                "Needs clear confirmation"
            ],
            painPoints: [
                "Too many input fields",
                "Confusing terms",
                "Slow feedback"
            ],
            accessibilityNeeds: [
                "Keyboard and touch flexibility",
                "Step-by-step animations",
                "Clear iconography"
            ],
            expectedInteractions: [
                "Tap or shortcut transfer",
                "Authenticate quickly",
                "Receive animated confirmation"
            ],
            toneGuidance: "Use supportive and lively language.",
            uxCharacteristics: [
                "Prefers assisted flows",
                "Short, guided interactions",
                "High reliance on visual feedback"
            ]
        },
        Educator: {
            generation: "Gen Alpha",
            occupation: "Educator",
            context: "A youth mentor is transferring funds to support a classroom project.",
            goal: "Complete the transfer easily with visual guidance.",
            motivations: [
                "Values simplicity and clarity",
                "Wants immediate assurance",
                "Prefers friendly UI tone"
            ],
            painPoints: [
                "Overly technical language",
                "Complex flows",
                "Unclear confirmation states"
            ],
            accessibilityNeeds: [
                "Clear, friendly labels",
                "Visual progress indicators",
                "Assistive cues"
            ],
            expectedInteractions: [
                "Follow animated guidance",
                "Authenticate with a simple action",
                "Receive a confirmation animation"
            ],
            toneGuidance: "Use warm and friendly language.",
            uxCharacteristics: [
                "Relies on visual cues and feedback",
                "Needs simplicity in flow",
                "Prefers encouraging UI tone"
            ]
        }
    }
};
