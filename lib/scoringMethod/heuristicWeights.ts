export const heuristicWeights = {
  // Each heuristic (01–10) corresponds to Nielsen’s 10 principles
  // and contributes weighted influence to key UX categories.
  heuristics: {
    "01": { name: "Visibility of System Status", affects: { accessibility: 0.3, usability: 0.7 } },
    "02": { name: "Match Between System and Real World", affects: { hierarchy: 0.4, usability: 0.6 } },
    "03": { name: "User Control and Freedom", affects: { layout: 0.4, usability: 0.6 } },
    "04": { name: "Consistency and Standards", affects: { typography: 0.5, hierarchy: 0.5 } },
    "05": { name: "Error Prevention", affects: { accessibility: 0.5, usability: 0.5 } },
    "06": { name: "Recognition Rather Than Recall", affects: { color: 0.5, hierarchy: 0.5 } },
    "07": { name: "Flexibility and Efficiency of Use", affects: { layout: 0.5, usability: 0.5 } },
    "08": { name: "Aesthetic and Minimalist Design", affects: { color: 0.4, typography: 0.6 } },
    "09": { name: "Help Users Recognize, Diagnose, and Recover from Errors", affects: { accessibility: 0.4, usability: 0.6 } },
    "10": { name: "Help and Documentation", affects: { accessibility: 0.7, usability: 0.3 } }
  },
  scoringFormula:
    "heuristicScore_i = Σ(category_j * weight_ij) / Σ(weight_ij)",
  citationSources: [
    "Nielsen, J. (1994). 10 Usability Heuristics for User Interface Design. Nielsen Norman Group.",
    "ISO 9241-210:2019 Ergonomics of human-system interaction — Human-centred design for interactive systems.",
    "W3C (2018). Web Content Accessibility Guidelines (WCAG) 2.1."
  ]
};
