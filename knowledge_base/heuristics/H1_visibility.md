# H1: Visibility of System Status
**Heuristic Principle:**  
The interface should always keep users informed about what is going on, through appropriate visual feedback, labels, or structural clarity, within a reasonable time.

**Scope (Figma Context):**  
In static design evaluations (Figma JSON data), "visibility of system status" can be approximated through *labeling clarity, structural hints, and affordance indicators* that visually suggest system state or interaction outcomes.  
Since Figma frames do not contain live transitions or dynamic feedback, the evaluation focuses on **perceptible design cues** that imply state awareness and feedback readiness.

---

## 1. Evaluation Focus Areas

| Area | Evaluated Property | Figma-Derived Indicators | Scoring Influence |
|------|--------------------|--------------------------|------------------|
| **Label Clarity** | Presence of descriptive text near interactive elements | Node type = `TEXT`, proximity to `BUTTON`, `INPUT`, or `ICON` | +2 pts |
| **State Indicators** | Visual difference between active/inactive components | Layer naming: “active”, “selected”, “disabled”; color contrast or opacity difference | +2 pts |
| **Affordance Cues** | Buttons, toggles, or icons clearly suggesting interactivity | `type: BUTTON`, presence of hover/focus layer variants | +1 pt |
| **Feedback-Ready Structure** | Presence of alert, toast, or modal component groups | Layer group names like “alert”, “modal”, “success”, “error” | +1 pt |
| **Visual Hierarchy Consistency** | Hierarchical ordering of labels vs. primary action | Font size, color prominence, `z-index` order | +1 pt |

**Maximum Subscore:** 4 points  
(If all static indicators are logically represented in the frame.)

---

## 2. Scoring Interpretation

| Score Range | Meaning | Implication for Design |
|--------------|----------|------------------------|
| **0–1** | Poor visibility | UI lacks feedback cues; user uncertain of what will happen. |
| **2–3** | Moderate visibility | Some states or cues visible but incomplete or inconsistent. |
| **4** | Excellent visibility | Design clearly communicates status and expected interaction outcomes. |

---

## 3. Figma Node Mapping Logic

| Figma Node Attribute | Example Value | Semantic Meaning |
|----------------------|----------------|------------------|
| `name` | “btn_login_active” | Indicates an active button state (status visible). |
| `fills.color` | Low opacity vs. high contrast variant | Suggests “disabled” vs. “active” state visibility. |
| `children[].type` | `"TEXT"` inside `"FRAME"` named “error_message” | Indicates feedback or validation message. |
| `frame.name` | “modal_loading”, “alert_error” | Suggests system communicating state. |

---

## 4. AI Scoring Considerations

- **Detection Rule:** The AI identifies node clusters with semantic labels (`active`, `loading`, `error`, `success`, `selected`) or visual contrast patterns.
- **Normalization Rule:** If multiple indicators overlap, only the most dominant per frame is scored (avoid inflation).
- **Weighting:** `visibility_score = (detected_indicators / max_indicators) * 4`

---

## 5. Example Evaluation

```json
{
  "frame_name": "Login Screen",
  "detected_indicators": ["active_button", "error_label", "input_focus_style"],
  "visibility_score": 4,
  "comments": "Login form clearly communicates input state and errors. Visual feedback for primary button active state visible."
}
