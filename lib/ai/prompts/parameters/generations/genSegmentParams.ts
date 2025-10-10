export const genSegmentParams = `{
  "Gen Z": {
    "range": "1997-2012",
    "description": "Digital natives who expect speed, interactivity, and inclusivity. Heavy users of mobile and visually expressive platforms.",
    "ux_expectations": [
      "Minimal friction, immediate response feedback, and dynamic visual flow.",
      "High mobile responsiveness and intuitive navigation.",
      "Inclusive color palettes and accessibility integration.",
      "Preference for sleek, immersive, and engaging design."
    ],
    "scoring_bias": {
      "accessibility": 1.0,
      "typography": 1.0,
      "color": 1.1,
      "layout": 1.1,
      "hierarchy": 1.0,
      "usability": 1.2
    },
    "bias_justification": {
      "accessibility": "Gen Z expects inclusive experiences but tends to rely on visual and speed cues more than accessibility tools; moderate weighting.",
      "typography": "Standard weighting as readability expectations align with modern defaults.",
      "color": "Slightly higher since Gen Z favors bold, contrast-rich visual identity seen in modern digital culture.",
      "layout": "Slightly higher due to mobile-first layouts and adaptive interactions being critical.",
      "hierarchy": "Standard weighting since Gen Z navigates fluidly through layered interfaces.",
      "usability": "High weighting because instant feedback, flow, and control strongly influence engagement."
    },
    "evaluation_focus": "Optimize for speed, responsiveness, and engagement — prioritize emotional and sensory usability."
  },

  "Millennial": {
    "range": "1981-1996",
    "description": "Experienced digital users who value clarity, stability, and purpose-driven interaction with consistent design patterns.",
    "ux_expectations": [
      "Predictable layout structure and logical navigation.",
      "Balanced aesthetics with functional clarity.",
      "Straightforward interfaces without unnecessary complexity.",
      "Accessible and consistent experiences across devices."
    ],
    "scoring_bias": {
      "accessibility": 1.1,
      "typography": 1.1,
      "color": 1.0,
      "layout": 1.0,
      "hierarchy": 1.0,
      "usability": 1.1
    },
    "bias_justification": {
      "accessibility": "Millennials value inclusive and device-consistent access, especially for professional workflows.",
      "typography": "Slightly elevated since they appreciate readability and clean, legible interfaces.",
      "color": "Neutral — visual design is appreciated but function outweighs flashiness.",
      "layout": "Standard weighting; emphasis is on familiarity over novelty.",
      "hierarchy": "Standard; they can adapt to conventional patterns easily.",
      "usability": "Elevated because smooth, efficient interaction affects productivity and trust."
    },
    "evaluation_focus": "Reward clarity, predictability, and balance between visual and functional usability."
  },

  "Gen Alpha": {
    "range": "2013-Present",
    "description": "The youngest, fully digital generation — learns visually, interacts via touch, and prefers gamified interfaces.",
    "ux_expectations": [
      "Visually interactive and feedback-heavy environments.",
      "Clear visual storytelling and gamified navigation.",
      "Simplified gestures and large, easy-to-tap UI components.",
      "Minimal text, high use of icons and micro-animations."
    ],
    "scoring_bias": {
      "accessibility": 1.2,
      "typography": 0.9,
      "color": 1.2,
      "layout": 1.1,
      "hierarchy": 1.1,
      "usability": 1.0
    },
    "bias_justification": {
      "accessibility": "Very high — younger users often have developing motor or cognitive abilities that demand accessible structure.",
      "typography": "Lower — text-heavy interfaces are less engaging and often skipped.",
      "color": "High — relies heavily on color cues, animation, and visual rewards for attention.",
      "layout": "Slightly higher to emphasize touch-friendly and adaptive designs.",
      "hierarchy": "Slightly higher since visual order supports learning and comprehension.",
      "usability": "Standard — focus remains on interactivity rather than efficiency."
    },
    "evaluation_focus": "Prioritize visual learning, cognitive simplicity, and interactive accessibility."
  }
};`