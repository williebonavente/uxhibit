export interface FrameEvaluation {
  id: string;
  snapshot: string;
  design_id?: string;
  version_id?: string;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  owner_id: string;
  ai_summary: string;
  ai_data: {
    overall_score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    issues: {
      id: string;
      severity: "low" | "medium" | "high";
      message: string;
      suggestion: string;
    }[];
    category_scores: {
      color: number;
      layout: number;
      hierarchy: number;
      usability: number;
      typography: number;
      accessibility: number;
    };
  };
  created_at: string;
  updated_at: string;
  total_score: number;
}

export type EvalResource = {
  issue_id: string;
  title: string;
  url: string;
  description: string;
};

export type EvaluateInput = {
  designId: string;
  fileKey: string;
  nodeId?: string;
  fallbackImageUrl?: string;
  snapshot: import("./design").Snapshot;
  url?: string;
  frameIds?: string[];
  versionId: string;
};

export type EvalResponse = {
  nodeId: string;
  imageUrl: string;
  summary: string;
  heuristics: any;
  ai_status?: "ok" | "skipped";
  overall_score?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  issues?: {
    id: string;
    severity: string;
    message: string;
    suggestion: string;
  }[];
  category_scores?: Record<string, number> | null;
  resources?: EvalResource[];
  ai?: {
    overall_score?: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    issues?: {
      id: string;
      severity?: string;
      message?: string;
      suggestions?: string;
    }[];
    category_scores?: Record<string, number>;
    category_score_justifications?: Record<string, string>;
    resources?: EvalResource[];
  } | null;
};