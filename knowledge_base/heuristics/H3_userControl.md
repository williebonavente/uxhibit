# Heuristic 3: User Control and Freedom

## Description
This heuristic emphasizes that users should always feel in control of the interface. They should be able to easily undo, redo, exit, or modify actions without unexpected constraints. This principle reduces user frustration and increases trust in the interface.

In static Figma design evaluation, this heuristic can be approximated by examining **interface affordances, navigation clarity, and visibility of escape or corrective actions** (e.g., "Cancel", "Undo", "Back", "Discard").

---

## Theoretical Basis
- **Nielsen (1994):** Users often make mistakes; systems should provide "clearly marked exits" and reversible actions.
- **Norman (2013):** Good design gives users perceived control, even when constraints exist.
- **Shneiderman’s Golden Rules:** Support internal locus of control — users should initiate actions rather than feeling controlled by the system.

---

## Figma-Based Evaluation Parameters

| Dimension | Node/Property Indicators | Example Criteria | Scoring Weight |
|------------|--------------------------|------------------|----------------|
| **Navigation Control** | Presence of buttons named `"Back"`, `"Cancel"`, `"Exit"`, `"Undo"`, `"Retry"` | Check if components with these text labels exist and are accessible in logical flow containers (e.g., `Frame`, `Modal`) | 0.25 |
| **Error Recovery Visibility** | Components suggesting correction (e.g., `"Undo"`, `"Try Again"`, `"Edit"`) | Score higher if the design explicitly provides recovery actions near possible error sources (e.g., input forms, alerts) | 0.25 |
| **Flow Interruptibility** | Detected modal/dialog frames with `"Close"` or `"X"` icons | A missing exit path in modal or confirmation dialogs reduces score | 0.20 |
| **Preventing User Traps** | Deep nesting of interactive components without escape routes | If no top-level navigation or home button is detected, apply penalty | 0.15 |
| **System Feedback for Actions** | Static feedback indicators such as progress bars or status text | These indicate reversibility or action acknowledgment | 0.15 |

---

## Example Rule Logic (for AI Scoring)
```json
{
  "heuristic_id": "H3",
  "criteria": [
    {
      "check": "frameHasElement(['Cancel', 'Back', 'Exit', 'Undo', 'Retry'])",
      "weight": 0.25,
      "description": "Checks if the frame offers a clear escape or control option."
    },
    {
      "check": "modalHasExitIcon(frame)",
      "weight": 0.20,
      "description": "Ensures modals and dialogs include an explicit close control."
    },
    {
      "check": "detectFormUndoRedo(frame)",
      "weight": 0.25,
      "description": "Detects presence of undo/redo or recovery options near input fields."
    },
    {
      "check": "frameNavigationDepth(frame) <= 3",
      "weight": 0.15,
      "description": "Prevents deep nesting that could trap users without visible exits."
    },
    {
      "check": "hasFeedbackIndicator(frame)",
      "weight": 0.15,
      "description": "Detects visual feedback that reinforces user control perception."
    }
  ]
}
