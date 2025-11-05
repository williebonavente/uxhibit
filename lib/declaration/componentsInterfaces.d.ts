import { DetectedInteractiveElement } from "./figmaInfo";
import { RGBA, BoundingBox } from "./figmaInfo";

export interface DetectedButton extends DetectedInteractiveElement {
  /** Text label of the button (normalized) */
  label: string;

  /** Whether the button has a clear visual boundary (rectangle, shadow, etc.) */
  hasVisibleBoundary?: boolean;

  /** Background fill color extracted from node */
  backgroundColor?: RGBA | null;

  /** Text color for contrast analysis */
  textColor?: RGBA | null;

  /** Calculated color contrast ratio (for WCAG 2.1 AA/AAA compliance) */
  contrastRatio?: number;

  /** Shape type: solid rectangle, ghost (outline only), icon-only, etc. */
  styleVariant?: "solid" | "outline" | "text" | "icon" | "ghost";

  /** Icon presence flag (if the button contains SVG/vector icon elements) */
  hasIcon?: boolean;

  /** Whether the button is large enough for touch interaction (min 44x44px per WCAG) */
  meetsTouchTarget?: boolean;

  /** Bounding box of the entire clickable area */
  boundingBox?: BoundingBox;

  /** Possible interaction states detected */
  states?: ("default" | "hover" | "pressed" | "disabled" | "focused")[];

  /** ARIA or accessibility labeling presence */
  ariaLabelPresent?: boolean;

  /** Whether text is all uppercase (common UI design pattern) */
  isUppercaseLabel?: boolean;

  /** Button purpose categorization for usability analysis */
  intent?: "primary" | "secondary" | "tertiary" | "danger" | "success" | "info";

  /** Whether the button was part of a form or navigation group */
  parentContext?: "form" | "dialog" | "navbar" | "card" | "standalone";

  /** Indicates if the label is descriptive enough (heuristic scoring) */
  labelClarityScore?: number;

  /** WCAG compliance flag for contrast & size */
  wcagCompliance?: "AA" | "AAA" | "Fail";
}
