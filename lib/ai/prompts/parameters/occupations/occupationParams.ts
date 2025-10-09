export const occupationParams = `{
    "Student": {
        "description": "Learners requiring intuitive, guided, and supportive digital environments with strong visual structure.",
        "ux_expectations": [
            "Guided steps, tooltips, and error prevention.",
            "Readable text with clear educational hierarchy.",
            "Accessible design suitable for low-end devices.",
            "Feedback-driven interactions promoting comprehension."
        ],
        "scoring_bias": {
            "accessibility": 1.1,
            "typography": 1.2,
            "color": 1.0,
            "layout": 1.1,
            "hierarchy": 1.0,
            "usability": 1.2
        },
        "bias_justification": {
            "accessibility": "Slightly higher — learners often depend on clarity and supportive interaction cues.",
            "typography": "Elevated because textual clarity impacts learning comprehension.",
            "color": "Neutral — aesthetics secondary to readability and focus.",
            "layout": "Slightly elevated to reward structured and guided flow.",
            "hierarchy": "Neutral — expectations are met if structure is intuitive.",
            "usability": "High — ease of learning and recovery from mistakes is essential."
        },
        "evaluation_focus": "Reward designs that promote cognitive clarity, learnability, and instructional flow."
    },

    "Freelancer": {
        "description": "Independent professionals prioritizing speed, efficiency, and clarity in multitasking workflows.",
        "ux_expectations": [
            "Quick task switching and responsive navigation.",
            "Simple and minimalistic dashboards.",
            "Visible progress indicators and undo freedom.",
            "Customizable, functional UI layouts."
        ],
        "scoring_bias": {
            "accessibility": 1.0,
            "typography": 1.0,
            "color": 1.0,
            "layout": 1.1,
            "hierarchy": 1.1,
            "usability": 1.2
        },
        "bias_justification": {
            "accessibility": "Standard — freelancers rely on speed more than accessibility tools.",
            "typography": "Neutral since functionality outweighs text style importance.",
            "color": "Neutral — as long as visual clarity is maintained.",
            "layout": "Slightly higher due to need for efficient dashboard structuring.",
            "hierarchy": "Slightly higher for quick information scanning.",
            "usability": "High — task efficiency directly impacts productivity."
        },
        "evaluation_focus": "Emphasize control, workflow efficiency, and task management clarity."
    },

    "Designer": {
        "description": "Aesthetically focused professionals with sensitivity to visual rhythm, typography, and creative balance.",
        "ux_expectations": [
            "Refined typography and spatial balance.",
            "Modern and harmonious color systems.",
            "Smooth transitions, visual rhythm, and alignment.",
            "Balance between innovation and usability."
        ],
        "scoring_bias": {
            "accessibility": 0.9,
            "typography": 1.3,
            "color": 1.3,
            "layout": 1.2,
            "hierarchy": 1.2,
            "usability": 1.0
        },
        "bias_justification": {
            "accessibility": "Slightly reduced as visual creativity sometimes overrides strict compliance.",
            "typography": "Strongly elevated — typography defines design identity for this group.",
            "color": "Strongly elevated — color theory and balance are critical quality signals.",
            "layout": "High — spatial composition and rhythm affect perception.",
            "hierarchy": "High — visual ordering defines usability in their view.",
            "usability": "Neutral — creativity is acceptable as long as functionality persists."
        },
        "evaluation_focus": "Prioritize visual coherence, spatial rhythm, and aesthetic innovation that preserves usability."
    },

    "Developer": {
        "description": "System-oriented users focused on functionality, consistency, and performance over decorative elements.",
        "ux_expectations": [
            "Predictable and logic-based navigation.",
            "Fast system feedback and code-like structure.",
            "Accessible controls and responsive behavior.",
            "Text and forms that are semantically clear."
        ],
        "scoring_bias": {
            "accessibility": 1.2,
            "typography": 1.0,
            "color": 0.9,
            "layout": 1.0,
            "hierarchy": 1.1,
            "usability": 1.3
        },
        "bias_justification": {
            "accessibility": "High — developers often evaluate semantic and accessible structure critically.",
            "typography": "Neutral — readability matters but visual design less so.",
            "color": "Slightly reduced — decorative use of color less relevant.",
            "layout": "Standard — focus on logical alignment.",
            "hierarchy": "Slightly higher to emphasize clear code-like organization.",
            "usability": "High — clarity, control, and function are key metrics."
        },
        "evaluation_focus": "Promote structural consistency, feedback accuracy, and interaction efficiency."
    },

    "Educator": {
        "description": "Professionals emphasizing inclusivity, clarity, and structure to accommodate diverse learners.",
        "ux_expectations": [
            "Accessible and adaptable learning interfaces.",
            "Readable, high-contrast typography.",
            "Straightforward navigation supporting instruction.",
            "Design accommodating cognitive and physical differences."
        ],
        "scoring_bias": {
            "accessibility": 1.3,
            "typography": 1.2,
            "color": 1.1,
            "layout": 1.0,
            "hierarchy": 1.0,
            "usability": 1.1
        },
        "bias_justification": {
            "accessibility": "Highest — accessibility directly affects learning inclusion.",
            "typography": "High — legibility is critical for comprehension.",
            "color": "Slightly higher — color aids comprehension but must remain subtle.",
            "layout": "Neutral — focus is on readability and navigation clarity.",
            "hierarchy": "Neutral — educators prefer predictable, linear structure.",
            "usability": "Slightly high — easy navigation aids instruction flow."
        },
        "evaluation_focus": "Reward inclusivity, content legibility, and instructional usability."
    }
};`