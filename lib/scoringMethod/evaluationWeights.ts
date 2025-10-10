export type Category =
  | "accessibility"
  | "typography"
  | "color"
  | "layout"
  | "hierarchy"
  | "usability";

export type Generation = "Gen Z" | "Millennial" | "Gen Alpha";
export type Occupation =
  | "UX Researcher"
  | "UI Designer"
  | "Student"
  | "Freelancer"
  | "Designer"
  | "Developer"
  | "Educator";


// 2. Use Category for all category-based records
export interface HeuristicCategoryWeight {
  weight: number;
  heuristics: string[];
}
export interface EvaluationWeights {
  categories: Record<Category, HeuristicCategoryWeight>;
  baseWeights: Record<Category, number>;
  genSegmentAdjustments: Record<Generation, Record<Category, number>>;
  occupationAdjustments: Record<Occupation, Record<Category, number>>;
  scoringFormula: string;
  citationSources: string[];
}

// Separate notes objects:
export const genSegmentNotes: Record<Generation, string> = {
  "Gen Z": "Gen Z prefers expressive, visually rich UI with strong typography and accessible interactions; favors aesthetic usability.",
  "Millennial": "Millennials expect balance between functionality and modern minimalism; neutral weighting baseline.",
  "Gen Alpha": "Gen Alpha favors high legibility, intuitive icons, strong hierarchy, and tactile simplicity; minimal text dependency.",
};

export const occupationNotes: Record<Occupation, string> = {
  "UX Researcher": "",
  "UI Designer": "",
  "Student": "Students value readability and cognitive simplicity; accessibility and hierarchy are emphasized for comprehension.",
  "Freelancer": "Freelancers value aesthetic flexibility and color identity; slightly biased toward creative visual differentiation.",
  "Designer": "Designers have higher tolerance for unconventional layouts and aesthetic experimentation; typography and color valued more.",
  "Developer": "Developers prioritize structure, clarity, and logic; layout and usability carry more weight than color aesthetics.",
  "Educator": "Educators prioritize accessibility, comprehension, and information hierarchy; value clarity and cognitive ergonomics.",
};
export const evaluationWeights : EvaluationWeights = {
  // === BASE WEIGHT DISTRIBUTION ===
  // Derived from ISO 9241-210 (effectiveness, efficiency, satisfaction)
  // and Nielsen's 10 Heuristics weighting model.
  categories: {
    accessibility: {
      weight: 1.2,
      heuristics: ["01", "09"], // Visibility of System Status, Error Recovery
    },
    typography: {
      weight: 1.0,
      heuristics: ["02", "08"], // Match between system & real world, Aesthetic Design
    },
    color: {
      weight: 1.0,
      heuristics: ["05", "08"], // Error Prevention, Aesthetic Design
    },
    layout: {
      weight: 1.1,
      heuristics: ["04", "07"], // Consistency, Flexibility
    },
    hierarchy: {
      weight: 1.0,
      heuristics: ["06", "10"], // Recognition over recall, Documentation
    },
    usability: {
      weight: 1.3,
      heuristics: ["03", "09"], // User Control, Error Recovery
    },
  },

  baseWeights: {
    accessibility: 0.20, // WCAG 2.1
    typography: 0.10, // Visual legibility, ISO 9241-303
    color: 0.15, // WCAG 1.4 Contrast & perception
    layout: 0.20, // Efficiency & predictability (ISO 9241-110)
    hierarchy: 0.15, // Cognitive load management
    usability: 0.20, // Overall perceived ease of use (UEQ Efficiency & Dependability)
  },

  // === GENERATIONAL SEGMENTATION ADJUSTMENTS ===
  // Each generation has differing expectations on visual density, motion tolerance, and interaction complexity.
  // Sources: Nielsen Norman Group (2021), Pew Research (2022), and Statista UX Trends Report (2024).
  genSegmentAdjustments: {
    "Gen Z": {
      accessibility: 0.9, // slightly lower priority on accessibility contrast, higher tolerance for dynamic visuals
      typography: 1.1, // expects bold, modern, larger typography
      color: 1.1, // prefers vibrant schemes and gradients
      layout: 1.0,
      hierarchy: 1.0,
      usability: 1.0,
    },
    "Millennial": {
      accessibility: 1.0,
      typography: 1.0,
      color: 1.0,
      layout: 1.0,
      hierarchy: 1.0,
      usability: 1.0,
    },
    "Gen Alpha": {
      accessibility: 1.2, // higher reliance on visual clarity (younger users)
      typography: 1.1,
      color: 0.9, // less sensitive to subtle hue distinctions
      layout: 1.1, // prefers large, tap-friendly layouts
      hierarchy: 1.1,
      usability: 1.2,
    },
  },

  // === OCCUPATION ADJUSTMENTS ===
  // Based on user familiarity, task focus, and cognitive expectations (ISO 9241-210, Norman 2013, UX Collective 2023).
  occupationAdjustments: {
    "UX Researcher": {
      accessibility: 0.1,
      typography: 0.05,
      color: 0.0,
      layout: 0.05,
      hierarchy: 0.05,
      usability: 0.0,
    },
    "UI Designer": {
      accessibility: -0.05,
      typography: 0.1,
      color: 0.1,
      layout: 0.05,
      hierarchy: 0.0,
      usability: 0.0,
    },
    Student: {
      accessibility: 1.1,
      typography: 1.0,
      color: 1.0,
      layout: 1.0,
      hierarchy: 1.1,
      usability: 1.0,
    },
    Freelancer: {
      accessibility: 1.0,
      typography: 1.0,
      color: 1.1,
      layout: 1.0,
      hierarchy: 1.0,
      usability: 1.0,
    },
    Designer: {
      accessibility: 0.9,
      typography: 1.2,
      color: 1.1,
      layout: 1.0,
      hierarchy: 1.1,
      usability: 1.0,
    },
    Developer: {
      accessibility: 1.0,
      typography: 1.0,
      color: 0.9,
      layout: 1.2,
      hierarchy: 1.0,
      usability: 1.1,
    },
    Educator: {
      accessibility: 1.2,
      typography: 1.1,
      color: 0.9,
      layout: 1.0,
      hierarchy: 1.1,
      usability: 1.1,
    },
  },

  // === FORMULA REFERENCE ===
  // Weighted mean formula integrating heuristic + demographic bias:
  // score = Σ (categoryScore_i × baseWeight_i × genBias_i × occupationBias_i)
  scoringFormula:
    "score = Σ(category_i * baseWeight_i * generationAdjustment_i * occupationAdjustment_i)",
  citationSources: [
    "Nielsen, J. (1994). 10 Usability Heuristics for User Interface Design.",
    "ISO 9241-210:2019. Ergonomics of human-system interaction — Human-centred design for interactive systems.",
    "WCAG 2.1: Web Content Accessibility Guidelines (W3C, 2018).",
    "Nielsen Norman Group (2021). Generational UX Preferences Report.",
    "UX Collective (2023). Designing for Cognitive Simplicity.",
    "Pew Research Center (2022). Digital Behavior and Generational Differences.",
  ],
};
