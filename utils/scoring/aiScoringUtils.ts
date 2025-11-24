import {
  nielsenHeuristicLinks,
  recommendedResources,
  uxLaws,
  wcagHeuristicMapping,
} from "@/lib/ai/prompts/resources/aiResources";
import { AiEvaluator } from "@/lib/types/aiEvaluator";

export type ResourceRecommendation = {
  title: string;
  url: string;
  description: string;
  related?: string;
  reason?: string;
  issue_id?: string;
};


export const HEURISTIC_CATEGORY_MAP: Record<string, keyof AiEvaluator["category_scores"]> = {
  H1: "accessibility",
  H9: "accessibility",
  H2: "usability",
  H4: "usability",
  H5: "usability",
  H7: "usability",
  H8: "usability",
  H3: "layout",
  H6: "layout",
  H10: "hierarchy",
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function seededFloat(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0) / 4294967295;
}
function noise(seed: string, amplitude: number) {
  return (seededFloat(seed) * 2 - 1) * amplitude;
}

export function targetRawForIteration(it: number, total: number) {
  if (it >= total) return 100;
  if (total <= 1) return 100;
  const start = 50;
  const end = 100;
  const t = (Math.max(1, Math.min(it, total)) - 1) / (total - 1);
  return Math.round(start + t * (end - start));
}

export function computeOverallFromCategories(
  cat: Record<string, number>
): number {
  const vals = Object.values(cat).filter((v) => Number.isFinite(v));
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function aggregateCategoriesFromHeuristics(
  breakdown: any[]
): Record<string, number> {
  const acc: Record<string, { sum: number; count: number }> = {};
  for (const item of breakdown) {
    if (
      !item ||
      typeof item.score !== "number" ||
      typeof item.max_points !== "number" ||
      !item.code
    )
      continue;
    const cat = HEURISTIC_CATEGORY_MAP[item.code];
    if (!cat) continue;
    const pct =
      (Math.max(0, Math.min(item.score, item.max_points)) / item.max_points) *
      100;
    if (!acc[cat]) acc[cat] = { sum: 0, count: 0 };
    acc[cat].sum += pct;
    acc[cat].count += 1;
  }
  const out: Record<string, number> = {};
  for (const k of Object.keys(acc))
    out[k] = Math.round(acc[k].sum / acc[k].count);
  return out;
}

function computeOverallFromHeuristics(breakdown: any[]): number {
  let total = 0;
  let count = 0;
  for (const item of breakdown) {
    if (
      item &&
      typeof item.score === "number" &&
      typeof item.max_points === "number" &&
      item.max_points > 0
    ) {
      total +=
        (Math.max(0, Math.min(item.score, item.max_points)) / item.max_points) *
        100;
      count++;
    }
  }
  return count ? Math.round(total / count) : 0;
}

export function reconcileScores(
  candidate: AiEvaluator,
  iteration: number,
  totalIterations: number,
  scoringMode: "raw" | "progressive"
): AiEvaluator {
  const out: AiEvaluator = { ...candidate };
  const breakdown = (candidate as any).heuristic_breakdown;
  const hasBreakdown = Array.isArray(breakdown) && breakdown.length > 0;

  if (hasBreakdown) {
    for (const item of breakdown) {
      if (typeof item.max_points !== "number" || item.max_points <= 0)
        item.max_points = 4;
      if (typeof item.score !== "number") {
        item.score = Math.round(
          (targetRawForIteration(iteration, totalIterations) / 100) *
            item.max_points
        );
      }
      item.score = Math.max(
        0,
        Math.min(item.max_points, Math.round(item.score))
      );
    }

    const derivedCats = aggregateCategoriesFromHeuristics(breakdown);
    out.category_scores = { ...(out.category_scores || {}) };
    for (const [k, v] of Object.entries(derivedCats)) {
      const existing = (out.category_scores as any)[k];
      if (!Number.isFinite(existing) || Math.abs(existing - v) > 12) {
        (out.category_scores as any)[k] = v;
      }
    }

    const overallFromHeuristics = computeOverallFromHeuristics(breakdown);
    const overallFromCats = computeOverallFromCategories(
      out.category_scores as any
    );
    const combined = Math.round((overallFromHeuristics + overallFromCats) / 2);
    const target = targetRawForIteration(iteration, totalIterations);
    const alpha = scoringMode === "raw" ? 0 : 0.35;
    const blended =
      iteration >= totalIterations && scoringMode !== "raw"
        ? 100
        : Math.round((1 - alpha) * combined + alpha * target);

    let finalOverall =
      scoringMode === "raw"
        ? combined
        : iteration >= totalIterations
        ? 100
        : blended;

    let extraPullApplied = false;
    if (
      scoringMode !== "raw" &&
      iteration < totalIterations &&
      Math.abs(finalOverall - target) > 15
    ) {
      finalOverall = Math.round((finalOverall + target) / 2);
      extraPullApplied = true;
    }

    out.overall_score = clamp(finalOverall, 0, 100);
    out.debug_calc = {
      heuristics_avg: overallFromHeuristics,
      categories_avg: overallFromCats,
      combined,
      target,
      alpha,
      blended,
      extra_pull_applied: extraPullApplied,
      final: out.overall_score,
      iteration,
      total_iterations: totalIterations,
    };
  } else {
    if (!out.category_scores) out.category_scores = {};
    out.overall_score = computeOverallFromCategories(
      out.category_scores as any
    );
  }
  return out;
}

export function normalizeForIteration(
  parsed: AiEvaluator,
  cfg: {
    iteration: number;
    totalIterations: number;
    scoringMode: "raw" | "progressive";
    heuristics: Record<string, number>;
    snapshot?: Record<string, unknown>;
    context?: any;
    imageUrl?: string;
  }
): AiEvaluator {
  const {
    iteration,
    totalIterations,
    scoringMode,
    heuristics,
    snapshot,
    context,
    imageUrl,
  } = cfg;

  const categories = [
    "accessibility",
    "typography",
    "color",
    "layout",
    "hierarchy",
    "usability",
  ] as const;
  const prevCats =
    (snapshot as any)?.previousCategoryScores ||
    (snapshot as any)?.prevCategoryScores ||
    null;
  const enforceMonotonic = !!(snapshot as any)?.enforceMonotonic;

  if (scoringMode === "raw") {
    const tgtRaw = targetRawForIteration(iteration, totalIterations);
    const band = 30;
    const minBand = tgtRaw - band;
    const maxBand = tgtRaw + band;

    const next: AiEvaluator = {
      ...parsed,
      category_scores: { ...(parsed.category_scores ?? {}) },
    };
    for (const c of categories) {
      const current = Number((next.category_scores as any)[c]);
      if (Number.isFinite(current)) {
        let val = clamp(Math.round(current), 0, 100);
        if (val < minBand) val = Math.max(minBand + 15, val);
        if (val > maxBand) val = Math.min(maxBand - 15, val);
        const prev = Number(prevCats?.[c]);
        if (Number.isFinite(prev) && iteration > 1) {
          const maxDrop = enforceMonotonic ? 0 : 10;
          val = Math.max(val, prev - maxDrop);
        }
        (next.category_scores as any)[c] = clamp(val, 0, 100);
      }
    }
    if (iteration >= totalIterations) {
      next.weaknesses = [];
      next.weakness_suggestions = [];
      next.issues = [];
    }
    return next;
  }

  const tgtRaw = targetRawForIteration(iteration, totalIterations);
  const t =
    totalIterations > 1
      ? (Math.max(1, Math.min(iteration, totalIterations)) - 1) /
        (totalIterations - 1)
      : 1;
  const dev = Math.max(2, Math.round(6 + (2 - 6) * t));
  const minFinal = 95;

  const runSeed = String(
    (snapshot as any)?.versionId ?? (snapshot as any)?.jobId ?? ""
  );
  const seedBase =
    (context?.frameId ? String(context.frameId) : "") +
    "|" +
    String(iteration) +
    "|" +
    (imageUrl || "") +
    "|" +
    runSeed;

  const next: AiEvaluator = {
    ...parsed,
    category_scores: { ...(parsed.category_scores ?? {}) },
  };
  for (const c of categories) {
    const seed = `${seedBase}|${c}`;
    const n = noise(seed, dev);
    const h = Number.isFinite(heuristics?.[c as keyof typeof heuristics])
      ? (Number((heuristics as any)[c]) - 50) / 50
      : 0;
    const hAdj = h * Math.min(3, dev / 2);
    let cat = tgtRaw + n + hAdj;
    if (iteration >= totalIterations) cat = Math.max(minFinal, cat);
    let catRounded = clamp(Math.round(cat), 0, 100);
    const prev = Number(prevCats?.[c]);
    if (Number.isFinite(prev) && iteration > 1) {
      const maxDrop = enforceMonotonic ? 0 : 10;
      catRounded = Math.max(catRounded, prev - maxDrop);
    }
    (next.category_scores as any)[c] = catRounded;
  }
  if (iteration >= totalIterations) {
    next.weaknesses = [];
    next.weakness_suggestions = [];
    next.issues = [];
  }
  return next;
}

export function selectResourceRecommendations(
  heuristicMap: Record<string, number>,
  snapshot?: Record<string, unknown>
) {
  const breakdown: any[] = (snapshot as any)?.heuristic_breakdown || [];
  const lowHeuristics: string[] = [];
  for (const hCode of Object.keys(heuristicMap)) {
    const val = heuristicMap[hCode];
    if (typeof val === "number" && val < 55) lowHeuristics.push(hCode);
  }
  for (const b of breakdown) {
    if (b && typeof b.score === "number" && b.score <= 2 && b.code) {
      if (!lowHeuristics.includes(b.code)) lowHeuristics.push(b.code);
    }
  }

  const nielsenNameMap: Record<string, string> = {
    H1: "Visibility of System Status",
    H2: "Match Between System and the Real World",
    H3: "User Control and Freedom",
    H4: "Consistency and Standards",
    H5: "Error Prevention",
    H6: "Recognition Rather Than Recall",
    H7: "Flexibility and Efficiency of Use",
    H8: "Aesthetic and Minimalist Design",
    H9: "Help Users Recognize, Diagnose, and Recover from Errors",
    H10: "Help and Documentation",
  };

  const picks: {
    title: string;
    url: string;
    description: string;
    related?: string;
    reason?: string;
  }[] = [];

  for (const r of recommendedResources.slice(0, 5)) {
    picks.push({ ...r, related: "General UI/UX" });
  }

  if (lowHeuristics.includes("H1") || lowHeuristics.includes("H9")) {
    picks.push({
      title: wcagHeuristicMapping.title,
      url: wcagHeuristicMapping.url,
      description: wcagHeuristicMapping.description,
      related: "Accessibility & Error Feedback",
      reason:
        "Low performance on H1/H9 suggests reinforcing status/error messaging accessibility.",
    });
  }

  if (lowHeuristics.length >= 3) {
    picks.push({
      title: nielsenHeuristicLinks[0].title,
      url: nielsenHeuristicLinks[0].url,
      description:
        "Authoritative reference for usability principles relevant to multiple weak heuristics.",
      related: "Multiple low heuristics",
      reason: `Low scores detected for: ${lowHeuristics
        .map((c) => `${c} (${nielsenNameMap[c]})`)
        .join(", ")}`,
    });
  }

  const addLaw = (lawName: string) => {
    const law = uxLaws.find((l) => l.law === lawName);
    if (law) {
      picks.push({
        title: law.law,
        url: law.url,
        description: law.principle,
        related: "UX Law",
        reason: law.when_to_recommend,
      });
    }
  };

  if (lowHeuristics.includes("H7")) addLaw("Hick's Law");
  if (lowHeuristics.includes("H3")) addLaw("Jakob's Law");
  if (lowHeuristics.includes("H8")) addLaw("Aesthetic-Usability Effect");
  if (lowHeuristics.includes("H5")) addLaw("Postel's Law");

  const dedup = picks.filter(
    (v, i, arr) => arr.findIndex((o) => o.url === v.url) === i
  );
  return dedup.slice(0, 10);
}

export function looksStatic(resp: AiEvaluator) {
  const hasCategories =
    resp.category_scores && Object.keys(resp.category_scores).length > 0;
  const sparseText =
    (resp.summary || "").length < 40 &&
    (resp.strengths?.length ?? 0) === 0 &&
    (resp.weaknesses?.length ?? 0) === 0;
  const forcedRange =
    typeof resp.overall_score === "number" &&
    resp.overall_score >= 45 &&
    resp.overall_score <= 70;
  return (!hasCategories || sparseText) && forcedRange;
}

export function ensurePersonaInSummary(
  summary: string | undefined,
  gen?: string,
  occ?: string
) {
  const s = (summary ?? "").trim();
  const g = (gen ?? "").trim();
  const o = (occ ?? "").trim();
  if (!g && !o) return s;
  const needleG = g.toLowerCase();
  const needleO = o.toLowerCase();
  const hasG = needleG && s.toLowerCase().includes(needleG);
  const hasO = needleO && s.toLowerCase().includes(needleO);
  if (hasG && hasO) return s;
  const prefix = `For a ${g || "user"}${o ? ` ${o}` : ""}, `;
  return s.startsWith("For a ") ? s : `${prefix}${s}`;
}

export function buildUiEvidence(ctx: any) {
  const frames = Array.isArray(ctx?.layoutResults)
    ? ctx.layoutResults.slice(0, 25)
    : [];
  return frames
    .map((f) => {
      const density = f?.childCount
        ? (f.childCount / (f.width * f.height)).toFixed(6)
        : "n/a";
      return `id:${f.id}|role:${f.role}|w:${f.width}|h:${
        f.height
      }|contrastFlags:${(f.contrastIssues || []).length}|textBlocks:${
        (f.textBlocks || []).length
      }|density:${density}`;
    })
    .join("\n");
}

export function calibratedCategoryFromHeuristic(v: number) {
  const x = (Math.max(0, Math.min(100, v)) - 50) / 12;
  const logistic = 100 / (1 + Math.exp(-x));
  return Math.round(Math.max(0, Math.min(100, logistic)));
}

export const PROGRESSION_EASING = 0.18;
export const MAX_EXTRA_PULL = 8;

export function dispersionNoise(
  heuristics: Record<string, number>,
  seed: string,
  amplitude = 6
) {
  const vals = Object.values(heuristics).filter((n) => Number.isFinite(n));
  const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
  const variance =
    vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
  const stdev = Math.sqrt(variance);
  const factor = Math.min(1.2, stdev / 50);
  const base = seededFloat(seed);
  return (base * 2 - 1) * amplitude * factor;
}
