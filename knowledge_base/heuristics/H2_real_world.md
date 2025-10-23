# H2: Match Between System and the Real World

**Heuristic Principle:**  
The system should speak the users’ language — with words, phrases, icons, and concepts familiar to the user — rather than system-oriented terms. Follow real-world conventions and present information in a natural, logical order.

**Scope (Figma Context):**  
Since Figma frames contain static interface representations, this heuristic is evaluated through **semantic, linguistic, and iconographic analysis** of visible text layers, component naming, and structure consistency. The AI model infers how well the design mirrors real-world expectations for the intended persona (e.g., “Gen Z Student,” “Freelancer Designer”).

---

## 1. Evaluation Focus Areas (Static Context)

| Area | Evaluated Property | Figma-Derived Indicators | Scoring Influence |
|------|--------------------|--------------------------|------------------|
| **Terminology Familiarity** | Text labels use natural, user-centered language | `TEXT.characters` field analysis (lexical familiarity, jargon detection) | +1.5 pts |
| **Icon Semantics** | Icons visually match expected real-world metaphors | `COMPONENT` or `INSTANCE` name patterns: “home”, “trash”, “upload”, “chat” | +1.0 pt |
| **Visual Grouping and Order** | Layout flow aligns with natural scanning patterns (L→R, top→bottom) | Node positions (`absoluteBoundingBox.x/y`), `autoLayout` direction | +0.5 pt |
| **Label-Action Consistency** | Button or link text clearly matches its implied outcome | e.g., “Save” vs. “Confirm”; “Upload” vs. “Submit” | +0.5 pt |
| **Persona Relevance** | Tone and visual metaphor align with persona dataset (if loaded) | Persona-based keyword match (e.g., “study”, “portfolio”, “project”) | +0.5 pt |

**Maximum Subscore:** 4 points  

---

## 2. Scoring Interpretation

| Score Range | Meaning | Design Interpretation |
|--------------|----------|-----------------------|
| **0–1** | System-centered | Uses jargon or unclear technical terms; poor real-world alignment. |
| **2–3** | Moderate alignment | Familiar icons and partial natural phrasing; still contains inconsistencies. |
| **4** | Excellent alignment | Strong use of familiar metaphors, clear action language, and persona-aligned tone. |

---

## 3. Figma Node Mapping Logic

| Figma Property | Example Value | Semantic Meaning |
|----------------|----------------|------------------|
| `text.characters` | “Upload your resume” | Natural, user-centered instruction (good alignment). |
| `component.name` | “icon_trash” | Real-world metaphor (delete = trash). |
| `frame.name` | “Profile Setup” | Natural concept; aligns with mental model. |
| `style.fontFamily` | “Comic Sans” | Informal or playful tone (context-dependent scoring). |
| `pluginData.persona_tag` | “student” | Persona linkage metadata for relevance scoring. |

---

## 4. AI Scoring Logic

1. **Language Model Analysis**
   - Perform lexical similarity to common-language corpus or persona lexicon.
   - Detect technical jargon or overly formal phrasing.
   - Example: “Authenticate” → low familiarity; “Log in” → high familiarity.

2. **Iconographic Mapping**
   - Match icon names (from `component.name` or `metadata.tags`) to real-world concepts.
   - Example: `"icon_cart" → shopping`, `"icon_trash" → delete`.

3. **Layout Flow Check**
   - Use `absoluteBoundingBox` positions or `autoLayout` direction to verify logical reading order (L→R, top→bottom).

4. **Persona Correlation**
   - If a persona context is active (e.g., Gen Z, Student), compute token similarity between interface wording and persona vocabulary (stored in `/personas/`).
   - Example: For Gen Z persona, words like *“explore”*, *“connect”*, *“create”* are more natural than *“configure”*, *“execute”*.

**Formula (pseudo):** 
real_world_score = (language_match + icon_semantics + layout_flow + persona_relevance) / 4 * 4

---
## 5. Example Evaluation

```json
{
  "frame_name": "Portfolio Upload",
  "language_match": 1.5,
  "icon_semantics": 1.0,
  "layout_flow": 0.5,
  "persona_relevance": 0.5,
  "real_world_score": 3.5,
  "comments": "Uses natural language ('Upload your project'), clear icons, and logical order. Slightly formal tone for Gen Z persona."
}
