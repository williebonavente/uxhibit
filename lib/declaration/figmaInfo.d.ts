
import { ComponentTypeFigma } from "./componentType";
import { InteractionType } from "./interactionType";

// =====================
// Base Color + Geometry
// =====================

export type RGBA = { r: number; g: number; b: number; a: number };
export type Effect =
  | {
    type: "DROP_SHADOW" | "INNER_SHADOW";
    color: RGBA;
    offset: { x: number; y: number };
    radius: number;
    spread?: number;
    visible?: boolean;
    blendMode?: string;
  }
  | {
    type: "LAYER_BLUR" | "BACKGROUND_BLUR";
    radius: number;
    visible?: boolean;
  };

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =====================
// Core Figma Node
// =====================
export type FigmaNode = {
  id: string;
  name: string;
  type: string; // FRAME, TEXT, RECTANGLE, COMPONENT, INSTANCE, GROUP
  visible?: boolean;
  absoluteBoundingBox?: BoundingBox;
  background?: { type: string; color?: RGBA }[];
  backgroundColor?: RGBA;
  fills?: { type: string; color: RGBA }[];
  effects?: Effect[];
  strokes?: { type: string; color: RGBA }[];
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeightPx?: number;
    letterSpacing?: number;
  };
  characters?: string;
  children?: FigmaNode[];

  // === NEW: metadata layers for heuristic + WCAG scoring ===
  accessibility?: AccessibilityMeta;
  layout?: LayoutMeta;
  interaction?: InteractionMeta;
  component?: ComponentMeta;
  colorMeta?: ColorMeta;
};

// =====================
// API Response Type
// =====================
export interface FigmaNodesResponse {
  name: string;
  role: string;
  nodes: Record<string, { document: FigmaNode }>;
}

// =====================
// Normalized Nodes
// =====================
export interface TextNode {
  id: string;
  text: string;
  fontSize: number;
  fontWeight: number;
  color: RGBA;
  boundingBox: BoundingBox | null;
  fontFamily: string;
  contrastRatio?: number;
  readableText?: boolean;
  alignment?: "left" | "center" | "right";
  role?: string;
}

export interface ShapeNode {
  id: string;
  type: "RECTANGLE" | "ELLIPSE" | "VECTOR";
  color: RGBA;
  boundingBox: BoundingBox;
  role?: string;
  isDecorative?: boolean;
}

export interface FrameNode {
  id: string;
  name: string;
  boundingBox: BoundingBox;
  backgroundColor?: RGBA | null;
  children: (TextNode | ShapeNode)[];
  skipAlignmentCheck?: boolean;
  frameType?: "layout" | "modal" | "component" | "section";
  parentFrameId?: string;
  hierarchyDepth?: number;
  zIndex?: number;
}

// =====================
// Metadata for Scoring
// =====================
export interface AccessibilityMeta {
  ariaLabel?: string;
  role?: string;
  altText?: string;
  hasFocusableState?: boolean;
  contrastRatio?: number;
  readableText?: boolean;
}

export interface LayoutMeta {
  alignment?: "horizontal" | "vertical" | "grid" | "free";
  spacingBetween?: number;
  responsive?: boolean;
  consistentMargins?: boolean;
  proximityGroups?: string[];
  gridUsed?: boolean;
}

export interface InteractionMeta {
  isInteractive?: boolean;
  interactionType?: InteractionType;
  targetFrameId?: string;
  hasAnimation?: boolean;
  prototypeAction?: string;
}

export interface ComponentMeta {
  variantName?: string;
  instanceOf?: string;                // component ID reference
  isAutoLayout?: boolean;
  hasConstraints?: boolean;
  componentTypes?: ComponentTypeFigma,
}

export interface ColorMeta {
  fillColor?: RGBA;
  textColor?: RGBA;
  strokeColor?: RGBA;
  backgroundColor?: RGBA;
  contrastAgainstParent?: number;
  isAccessibleContrast?: boolean;
}

// =====================
// Document Wrapper
// =====================
export interface NormalizedDocument {
  frames: FrameNode[];
  accessibilitySummary?: {
    totalTextNodes?: number;
    nodesWithLowContrast?: number;
    unlabeledInteractiveElements?: number;
  };
  detectedComponents?: Record<string, number>; // e.g { Button: 5, Input: 3 }
  evaluationTimestamp?: string;
}

export type DetectedInteractiveElemet = {
  id: string;
  label: string;
  nodeType: string;
  nodeName: string;
  // Adding the kind or type of the field such as `button`, `accordion`
  kind?: string;
}