# Heuristic 4: Consistency and Standards

## Description
Users should not have to wonder whether different words, situations, or actions mean the same thing. The design should follow platform conventions, adhere to visual hierarchy rules, and maintain consistency in component behavior, labeling, and styling across screens.  

For Figma-based static analysis, this heuristic translates to evaluating **naming conventions, style uniformity, text label consistency, color use, and component reuse** across the design frames.

---

## Theoretical Basis
- **Nielsen (1994):** Users experience lower cognitive load when systems follow internal and external consistency.
- **Norman (2013):** Visual and interaction consistency supports the creation of accurate mental models.
- **Tognazzini (2014):** Predictability and repetition reduce learning effort and improve perceived professionalism.
- **ISO 9241-210 (2019):** Consistency enhances usability through recognizable interaction patterns.

---

## Figma-Based Evaluation Parameters

| Dimension | Node/Property Indicators | Example Criteria | Scoring Weight |
|------------|--------------------------|------------------|----------------|
| **Typography Consistency** | Font family, size, and style across text nodes | Same heading levels use identical typography styles | 0.25 |
| **Color Consistency** | Fills and strokes across components | Consistent color usage for identical component roles (e.g., primary button) | 0.20 |
| **Component Reuse** | Use of Figma `ComponentInstance` vs. duplicated shapes | Detects inconsistent component usage across similar UI regions | 0.25 |
| **Naming and Labeling Consistency** | Node names and text labels follow consistent semantics | “Submit” and “Save” performing the same function lowers consistency score | 0.15 |
| **Layout Grid Uniformity** | Constraints, auto-layout, and spacing | Detect uniform padding and spacing within similar frames | 0.15 |

---

## Example Rule Logic (for AI Scoring)
```json
{
  "heuristic_id": "H4",
  "criteria": [
    {
      "check": "detectTextStyleInconsistency(frame)",
      "weight": 0.25,
      "description": "Checks whether text nodes deviate from standard typography tokens."
    },
    {
      "check": "detectColorTokenVariance(frame)",
      "weight": 0.20,
      "description": "Analyzes inconsistent color usage across same-role components."
    },
    {
      "check": "detectUnlinkedComponentInstances(frame)",
      "weight": 0.25,
      "description": "Detects duplicated component structures instead of instances."
    },
    {
      "check": "detectLabelConflict(frame)",
      "weight": 0.15,
      "description": "Checks inconsistent labeling or mismatched text semantics."
    },
    {
      "check": "detectSpacingDeviation(frame)",
      "weight": 0.15,
      "description": "Analyzes grid alignment and spacing irregularities."
    }
  ]
}
