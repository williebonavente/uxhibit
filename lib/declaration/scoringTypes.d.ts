import { RGBA, TextNode } from "./figmaInfo";

export type FrameTextMap = Record<string, {
  frameId: string;
  frameName: string;
  backgroundColor?: RGBA | null;
  textNodes: TextNode[];
  rawFrameNode?: any; // original frame document from Figma if needed
}>;

export interface TextNodeDetail extends TextNode {
  contrastRatio?: number;
  contrastScore?: number;
}

export interface InteractiveNodeDetail {
  id: string;
  boundingBox: { x:number; y:number; width:number; height:number } | null;
  type?: string;
  size?: { width: number; height: number } | null;
}

export interface CategoryScores {
  color: number;
  typography: number;
  usability: number;
  layout: number;
  hierarchy: number;
  overall: number;
}

export interface FrameScoreResult {
  frameId: string;
  frameName: string;
  scores: CategoryScores;
  justification?: Record<string,string>;
  textDetails: TextNodeDetail[];
  interactiveDetails: InteractiveNodeDetail[];
}