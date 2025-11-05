# Heuristic 5: Error Prevention

## Description
Good design prevents errors before they occur by providing clear affordances, distinct visual cues, proper input validation, and constraints that reduce user mistakes.  
In static UI analysis (via Figma JSON), **error prevention is inferred from the clarity of interactive elements, label structure, field grouping, affordance indicators, and feedback design placeholders** (such as error text layers, tooltip icons, or disabled button states).

---

## Theoretical Basis
- **Nielsen (1994):** Systems should prevent problems by eliminating error-prone conditions or checking for them before users commit to actions.  
- **Norman (2013):** Constraints and feedback loops help users form accurate mental models, lowering cognitive error rates.  
- **ISO 25010 (2011):** Quality in use attributes (effectiveness and error tolerance) relate directly to the ability of the interface to prevent user mistakes.  
- **Shneiderman (1987):** Prevention is superior to recovery; the interface should make errors *impossible* rather than easy to correct.

---

## Figma-Based Evaluation Parameters

| Dimension | Node/Property Indicators | Example Criteria | Scoring Weight |
|------------|--------------------------|------------------|----------------|
| **Field Label Clarity** | `TextNode` proximity to `Input` components | Each input has a clear and adjacent label | 0.25 |
| **Validation/Error Messaging Presence** | Text nodes with keywords: “error”, “required”, “invalid”, or red color codes | Presence of distinct error message elements | 0.25 |
| **Affordance Indicators** | Button opacity, hover states, disabled state visibility | Disabled buttons before form completion or valid states | 0.20 |
| **Action Confirmation Elements** | “Cancel”, “Undo”, or “Are you sure” labels near critical actions | Detection of confirmation or cancel affordances | 0.15 |
| **Form Constraints/Guidance** | Placeholder hints, input masks, helper text | Clear guidance reduces likelihood of invalid entries | 0.15 |

---

## Example Rule Logic (for AI Scoring)
```json
{
  "heuristic_id": "H5",
  "criteria": [
    {
      "check": "detectInputWithoutLabel(frame)",
      "weight": 0.25,
      "description": "Detects input fields lacking text labels or hint text within proximity threshold."
    },
    {
      "check": "detectErrorMessageLayers(frame)",
      "weight": 0.25,
      "description": "Scans text nodes for error states or red semantic color tokens."
    },
    {
      "check": "detectAffordanceStates(frame)",
      "weight": 0.20,
      "description": "Analyzes presence of disabled, hover, or active state variants for interactive components."
    },
    {
      "check": "detectConfirmationOrCancelActions(frame)",
      "weight": 0.15,
      "description": "Checks for cancel/confirmation UI near destructive actions."
    },
    {
      "check": "detectHelperTextOrPlaceholders(frame)",
      "weight": 0.15,
      "description": "Checks if helper texts or placeholders exist within form groups."
    }
  ]
}
