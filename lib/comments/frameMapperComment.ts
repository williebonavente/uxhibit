import type { FrameEvaluation } from "@/lib/types/evalResponse";
import type { EvalResponse } from "@/lib/types/evalResponse";

export function mapFrameToEvalResponse(frame: FrameEvaluation, frameIdx = 0): EvalResponse {
  const aiData = frame.ai_data ?? {};
  return {
    nodeId: frame.node_id,
    imageUrl: frame.thumbnail_url,
    summary: frame.ai_summary || aiData.summary || "",
    heuristics: null,
    ai_status: "ok",
    overall_score: aiData.overall_score ?? null,
    strengths: aiData.strengths ?? [],
    weaknesses: aiData.weaknesses ?? [],
    issues: (aiData.issues ?? []).map((issue: any, issueIdx: number) => ({
      ...issue,
      id: `frame${frameIdx}-issue${issueIdx}`,
      suggestions: issue.suggestion,
    })),
    category_scores: aiData.category_scores ?? null,
    ai: {
      ...aiData,
      issues: (aiData.issues ?? []).map((issue: any, issueIdx: number) => ({
        ...issue,
        id: `frame${frameIdx}-issue${issueIdx}`,
        suggestions: issue.suggestion,
      })),
    },
  } as EvalResponse;
}