# Heuristic 6: Recognition Rather Than Recall

## Description
The design should minimize users' memory load by making relevant options, actions, and information **visible** or easily retrievable. Users should not have to remember information from one part of the interface to another.  

For static UI evaluation (Figma JSON), this heuristic focuses on **visibility of labels, icons with text, form hinting, navigational clarity, and proximity of related information** — ensuring users can act based on what they see, not what they must recall.

---

## Theoretical Basis
- **Nielsen (1994):** Recognition is easier than recall because it requires less cognitive effort. Interfaces should make options visible rather than relying on memory.
- **Miller (1956):** Human working memory has limited capacity (~7 ± 2 items), making recall inherently more error-prone.
- **Norman (2013):** Recognition supports better mental model alignment and faster task completion.
- **Shneiderman (1987):** Reducing memory load improves interface learnability, especially for novice users.
- **ISO 9241-210 (2019):** Interfaces that minimize memory load contribute to effectiveness and efficiency in interaction.

---

## Figma-Based Evaluation Parameters

| Dimension | Node/Property Indicators | Example Criteria | Scoring Weight |
|------------|--------------------------|------------------|----------------|
| **Label Visibility** | TextNode presence on key interactive elements | Buttons and inputs are labeled, not icon-only | 0.25 |
| **Icon-Text Pairing** | Icon node with adjacent Text node | Icons are paired with text labels to avoid recall | 0.20 |
| **Proximity of Instructions** | Helper texts or hints near form fields | Guidance is placed *where* the user needs it | 0.20 |
| **Navigation Clarity** | Menu structure, breadcrumb or side nav | Users can orient themselves visually without memory | 0.20 |
| **State or Selection Visibility** | Tabs, toggles, and checkboxes with visible active states | Selected options are obvious, not inferred | 0.15 |

---

## Example Rule Logic (for AI Scoring)
```json
{
  "heuristic_id": "H6",
  "criteria": [
    {
      "check": "detectUnlabeledInteractiveNodes(frame)",
      "weight": 0.25,
      "description": "Checks for icon-only buttons or inputs with no visible labels."
    },
    {
      "check": "detectIconTextPairing(frame)",
      "weight": 0.20,
      "description": "Verifies whether icons have nearby text nodes for semantic clarity."
    },
    {
      "check": "detectHelperTextProximity(frame)",
      "weight": 0.20,
      "description": "Determines if instructional text is near its relevant input or action node."
    },
    {
      "check": "detectNavigationStructure(frame)",
      "weight": 0.20,
      "description": "Analyzes visible navigation structures or orientation indicators."
    },
    {
      "check": "detectActiveStateVisibility(frame)",
      "weight": 0.15,
      "description": "Checks whether active states are visually represented (e.g., tab highlight)."
    }
  ]
}
