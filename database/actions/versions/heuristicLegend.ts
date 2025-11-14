import { createClient } from "@/utils/supabase/client";

export type HeuristicLegendItem = {
  code?: string;
  title?: string;
  description?: string;
  category?: string;
  severity?: number | string;
  scores?: number;
  max_points?: number | string;
  evaluation_focus?: string;
};

const toArr = <T>(v: T | T[] | null | undefined): T[] =>
  Array.isArray(v) ? v : v == null ? [] : [v];

function mapEntry(raw: any) {
  return {
    code: raw?.code,
    title: raw?.principle || raw?.title,
    description: raw?.justification || raw?.description,
    category: raw?.category || "Heuristic",
    severity: raw?.severity,
    score: typeof raw?.score === "number" ? raw.score : undefined,
    max_points: typeof raw?.max_points === "number" ? raw.max_points : undefined,
    evaluation_focus: raw?.evaluation_focus
  };
}

export function extractHeuristicLegend(aiData: any): HeuristicLegendItem[] {
  const result: HeuristicLegendItem[] = [];
  const roots = toArr(aiData);

  const pushBreakdowns = (arr: any[]) => {
    for (const entry of arr) {
      if (entry) result.push(mapEntry(entry));
    }
  };

  for (const root of roots) {
    if (!root) continue;

    // Case 1: direct ai object on root (your sample)
    const directAi = root.ai || root.AI || root.analysis;
    if (
      directAi?.heuristic_breakdown &&
      Array.isArray(directAi.heuristic_breakdown)
    ) {
      pushBreakdowns(directAi.heuristic_breakdown);
    }

    // Case 2: root.frames[]
    const frames = toArr(root.frames);
    for (const f of frames) {
      const ai = f?.ai || f?.AI || f?.analysis;
      if (ai?.heuristic_breakdown && Array.isArray(ai.heuristic_breakdown)) {
        pushBreakdowns(ai.heuristic_breakdown);
      }
    }

    // Case 3: root already looks like a frame object (has node_id + ai)
    if (
      !frames.length &&
      directAi?.heuristic_breakdown &&
      Array.isArray(directAi.heuristic_breakdown)
    ) {
      // already handled above
    }
  }

  // If top-level itself is a frame list (array of frame objects)
  if (Array.isArray(aiData) && result.length === 0) {
    for (const frame of aiData) {
      const ai = frame?.ai || frame?.AI || frame?.analysis;
      if (ai?.heuristic_breakdown) {
        pushBreakdowns(toArr(ai.heuristic_breakdown));
      }
    }
  }

  // Dedup
  const dedup = new Map<string, HeuristicLegendItem>();
  for (const it of result) {
    const key = (it.code || it.title || JSON.stringify(it)).toString();
    const prev = dedup.get(key);
    if (!prev) dedup.set(key, it);
    else {
      const a = Number(prev.severity);
      const b = Number(it.severity);
      if (!Number.isNaN(b) && (Number.isNaN(a) || b > a)) dedup.set(key, it);
    }
  }

  const items = Array.from(dedup.values());
  items.sort((x, y) => {
    const cx = x.code ?? "";
    const cy = y.code ?? "";
    return cx && cy
      ? cx.localeCompare(cy, undefined, { numeric: true })
      : (x.title ?? "").localeCompare(y.title ?? "");
  });
  return items;
}

export async function getHeuristicLegendFromVersion(
  versionId: string
): Promise<HeuristicLegendItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("design_versions")
    .select("ai_data")
    .eq("id", versionId)
    .single();

  if (error) throw error;
  return extractHeuristicLegend(data?.ai_data);
}
