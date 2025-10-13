export type RGBA = { r: number; g: number; b: number; a: number };

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FigmaNode = {
  id: string;
  name: string;
  type: string; // FRAME, TEXT, RECTANGLE
  visible?: boolean;
  absoluteBoundingBox?: BoundingBox;
  background?: { type: string; color?: RGBA}[];
  backgroundColor?: RGBA;
  fills?: { type: string; color: RGBA }[];
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
};


export interface FigmaNodesResponse {
  name: string;
  role: string;
  nodes: Record<string, { document: FigmaNode }>;
}

// Cleaned and normalized structures for scoring
export interface TextNode {
  id: string;
  text: string;
  fontSize: number;
  fontWeight: number;
  color: RGBA;
  boundingBox: BoundingBox | null;
  fontFamily: string;
}


export interface FrameNode {
  id: string;
  name: string;
  boundingBox: BoundingBox;
  backgroundColor?: RGBA | null;
  children: (TextNode | ShapeNode)[];
  skipAlignmentCheck?: boolean;
}


export interface ShapeNode {
  id: string;
  type: "RECTANGLE" | "ELLIPSE" | "VECTOR";
  color: RGBA;
  boundingBox: BoundingBox;
}

export interface NormalizedDocument {
  frames: FrameNode[];
}