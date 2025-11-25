import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calculator,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Divide,
  Equal,
  Info,
  ListChecks,
  Percent,
  Plus,
  SearchCheck,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type HeuristicItem = {
  principle: string;
  code:
    | "H1"
    | "H2"
    | "H3"
    | "H4"
    | "H5"
    | "H6"
    | "H7"
    | "H8"
    | "H9"
    | "H10"
    | string;
  max_points: number;
  score: number;
  evaluation_focus?: string;
  justification?: string;
};

type BiasParams = {
  focus?: string;
  device?: string;
  generation?: string;
  occupation?: string;
  strictness?: string;
};

type BiasData = {
  params?: BiasParams;
  categoryWeights?: {
    color?: number;
    layout?: number;
    hierarchy?: number;
    usability?: number;
    typography?: number;
    accessibility?: number;
  };
  weighted_overall?: number;
  severityMultipliers?: {
    content?: number;
    usability?: number;
    accessibility?: number;
  };
};

type AiEvalLite = {
  overall_score?: number;
  category_scores?: Partial<
    Record<
      | "accessibility"
      | "typography"
      | "color"
      | "layout"
      | "hierarchy"
      | "usability",
      number
    >
  >;
  heuristic_breakdown?: HeuristicItem[];
  debug_calc?: {
    heuristics_avg: number;
    categories_avg: number;
    combined: number;
    target: number;
    alpha: number;
    blended: number;
    extra_pull_applied: boolean;
    final: number;
    iteration: number;
    total_iterations: number;
  };
  bias?: BiasData;
};

type FrameEval = {
  id: string;
  name?: string;
  ai?: AiEvalLite;
};

type ComputationalBreakdownProps = {
  open: boolean;
  onClose: () => void;
  frames: FrameEval[];
  initialFrameId?: string;
  loading?: boolean;
  iteration?: number;
  totalIterations?: number;
};

const categoryOrder: Array<keyof NonNullable<AiEvalLite["category_scores"]>> = [
  "color",
  "layout",
  "hierarchy",
  "usability",
  "typography",
  "accessibility",
];

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function percentFromHeuristic(item: HeuristicItem) {
  if (!item || !item.max_points) return 0;
  const pct = (clamp(item.score, 0, item.max_points) / item.max_points) * 100;
  return Math.round(pct);
}

const heuristicToCategory: Record<
  string,
  keyof NonNullable<AiEvalLite["category_scores"]>
> = {
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

const Bar = ({ value }: { value: number }) => {
  const v = clamp(Math.round(value || 0), 0, 100);
  const hue = Math.round((v / 100) * 120);
  const fill = `hsl(${hue} 85% 55%)`;
  const glow = `0 0 0 2px hsl(${hue} 90% 65% / .25), 0 0 14px hsl(${hue} 90% 50% / .45)`;
  return (
    <div className="relative w-full h-2.5 rounded-full bg-gradient-to-r from-gray-200/80 to-gray-300/60 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out relative"
        style={{
          width: `${v}%`,
          background: `linear-gradient(90deg, ${fill}, ${fill})`,
          boxShadow: v > 0 ? glow : "none",
        }}
      >
        {/* Animated stripes within the filled area */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,.25) 0 10px, transparent 10px 20px)",
            backgroundSize: "200% 100%",
            animation: "barStripes 4s linear infinite",
          }}
        />
        {/* End cap knob */}
        {v > 0 && (
          <span
            className="absolute -right-1 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border border-white"
            style={{ background: fill, boxShadow: glow }}
            aria-hidden
          />
        )}
      </div>
      {/* Subtle inset glow when very high */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: v >= 90 ? "inset 0 0 12px rgba(255,255,255,.25)" : "none",
        }}
      />
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-sm text-gray-500 py-6 text-center">{message}</div>
);

// Same target function as aiEvaluator
function targetRawForIteration(it: number, total: number) {
  if (it >= total) return 100;
  if (total <= 1) return 100;
  const start = 50;
  const end = 100;
  const t = (Math.max(1, Math.min(it, total)) - 1) / (total - 1); // 0..1
  return Math.round(start + t * (end - start));
}

function generationToAgeRange(gen?: string, year = new Date().getFullYear()) {
  const ranges: Record<string, [number, number]> = {
    Silent: [1928, 1945],
    Boomer: [1946, 1964],
    "Baby Boomer": [1946, 1964],
    "Gen X": [1965, 1980],
    "Generation X": [1965, 1980],
    Millennial: [1981, 1996],
    "Gen Y": [1981, 1996],
    "Gen Z": [1997, 2012],
    "Generation Z": [1997, 2012],
    "Gen Alpha": [2013, 2025],
    "Generation Alpha": [2013, 2025],
  };
  if (!gen) return null;
  const key = Object.keys(ranges).find(
    (k) => k.toLowerCase() === gen.toLowerCase()
  );
  const born = key ? ranges[key] : undefined;
  if (!born) return null;
  const min = year - born[1]; // youngest = current - max birth year
  const max = year - born[0]; // oldest = current - min birth year
  return { min, max };
}

const ComputationalBreakdown: React.FC<ComputationalBreakdownProps> = ({
  open,
  onClose,
  frames,
  initialFrameId,
  loading,
  iteration,
  totalIterations,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCalc, setShowCalc] = useState<boolean>(false);
  const [showPersonaDetails, setShowPersonaDetails] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialFrameId && frames.some((f) => f.id === initialFrameId)) {
      setSelectedId(initialFrameId);
    } else if (frames.length) {
      setSelectedId(frames[0].id);
    } else {
      setSelectedId(null);
    }
  }, [open, initialFrameId, frames]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const selected = useMemo(
    () => frames.find((f) => f.id === selectedId),
    [frames, selectedId]
  );

  const categories = selected?.ai?.category_scores ?? {};
  const categoriesList = useMemo(() => {
    // Build list for display in preferred order; fall back to present keys
    const keys = categoryOrder.filter((k) => typeof categories[k] === "number");
    const rest = Object.keys(categories)
      .filter((k) => !keys.includes(k as any))
      .map((k) => k as keyof typeof categories);
    const all = [...keys, ...rest];
    return all.map((k) => ({
      key: k as string,
      value: Number(categories[k] || 0),
    }));
  }, [categories]);

  const heuristicBreakdown = (selected?.ai?.heuristic_breakdown ??
    []) as HeuristicItem[];
  const hasHeuristics =
    Array.isArray(heuristicBreakdown) && heuristicBreakdown.length > 0;

  const heuristicPercents = useMemo(
    () =>
      (heuristicBreakdown || []).map((h) => ({
        code: h.code,
        principle: h.principle,
        percent: percentFromHeuristic(h),
        category: heuristicToCategory[h.code] || "n/a",
        raw: `${clamp(h.score, 0, h.max_points)} / ${h.max_points}`,
      })),
    [heuristicBreakdown]
  );

  // Aggregate category from heuristics
  const derivedCategoryFromHeuristics = useMemo(() => {
    const bucket: Record<string, { sum: number; count: number }> = {};
    for (const row of heuristicPercents) {
      if (row.category === "n/a") continue;
      if (!bucket[row.category]) bucket[row.category] = { sum: 0, count: 0 };
      bucket[row.category].sum += row.percent;
      bucket[row.category].count += 1;
    }
    const out: { key: string; avg: number }[] = [];
    for (const k of Object.keys(bucket)) {
      out.push({
        key: k,
        avg: Math.round(bucket[k].sum / bucket[k].count),
      });
    }
    return out.sort((a, b) => a.key.localeCompare(b.key));
  }, [heuristicPercents]);

  // Overall (heuristics avg, categories avg, combined)
  const overallHeuristicsAvg = useMemo(() => {
    const vals = heuristicPercents.map((h) => h.percent);
    return vals.length
      ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      : 0;
  }, [heuristicPercents]);

  const overallCategoriesAvg = useMemo(() => {
    const vals = Object.values(categories).filter((v) => typeof v === "number");
    return vals.length
      ? Math.round(
          (vals as number[]).reduce((a, b) => a + b, 0) /
            (vals as number[]).length
        )
      : 0;
  }, [categories]);

  const combinedOverall = useMemo(
    () => Math.round((overallHeuristicsAvg + overallCategoriesAvg) / 2),
    [overallHeuristicsAvg, overallCategoriesAvg]
  );

  // Legend: list codes per category for the explainer
  const categoryToCodes = useMemo(() => {
    const out: Record<string, string[]> = {};
    Object.entries(heuristicToCategory).forEach(([code, cat]) => {
      if (!out[cat]) out[cat] = [];
      out[cat].push(code);
    });
    return out;
  }, []);

  // Progression adjustment (mirrors aiEvaluator reconciliation)
  const dbg = selected?.ai?.debug_calc;
  const iter = typeof iteration === "number" ? iteration : 1;
  const totalIters = typeof totalIterations === "number" ? totalIterations : 3;
  const progressionTarget =
    dbg?.target ?? targetRawForIteration(iter, totalIters);
  let blendedOverall =
    typeof dbg?.final === "number"
      ? dbg.final
      : iter >= totalIters
      ? 100
      : Math.round(0.65 * combinedOverall + 0.35 * progressionTarget);
  if (
    !dbg &&
    iter < totalIters &&
    Math.abs(blendedOverall - progressionTarget) > 15
  ) {
    blendedOverall = Math.round((blendedOverall + progressionTarget) / 2);
  }

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
      {message}
    </div>
  );

  const displayOverallFor = (ai?: AiEvalLite) => {
    if (!ai) return null;
    if (ai.debug_calc) {
      if (typeof ai.debug_calc.final === "number") return ai.debug_calc.final;
      if (typeof ai.debug_calc.combined === "number")
        return ai.debug_calc.combined;
    }
    if (typeof ai.overall_score === "number") return ai.overall_score;
    return null;
  };

  const bias = selected?.ai?.bias;

  const parameterAvg = useMemo(() => {
    if (!bias) return overallCategoriesAvg;
    const { categoryWeights, severityMultipliers, params, weighted_overall } =
      bias;
    const weightSum = categoryWeights
      ? Object.values(categoryWeights).reduce(
          (a, b) => a + (typeof b === "number" ? b : 0),
          0
        )
      : 1;
    const severityVals = severityMultipliers
      ? Object.values(severityMultipliers).filter(
          (v): v is number => typeof v === "number"
        )
      : [];
    const severityAvg = severityVals.length
      ? severityVals.reduce((a, b) => a + b, 0) / severityVals.length
      : 1;
    const gen = params?.generation?.toLowerCase();
    const occ = params?.occupation?.toLowerCase();
    const genFactorMap: Record<string, number> = {
      millennial: 1.0,
      "gen z": 0.98,
      "generation z": 0.98,
      "gen x": 0.97,
      "generation x": 0.97,
      boomer: 0.95,
      "baby boomer": 0.95,
    };
    const occFactorMap: Record<string, number> = {
      freelancer: 1.02,
      student: 0.99,
      manager: 1.01,
      designer: 1.0,
      developer: 1.0,
    };
    const genFactor = genFactorMap[gen ?? ""] ?? 1.0;
    const occFactor = occFactorMap[occ ?? ""] ?? 1.0;
    const stabilizer =
      typeof weighted_overall === "number"
        ? clamp(weighted_overall, 0, 100) / 100
        : 1;
    const base =
      weightSum * ((genFactor + occFactor) / 2) * severityAvg * stabilizer;
    return clamp(Math.round(base * 100), 0, 100);
  }, [bias, overallCategoriesAvg]);

  const personaMetrics = useMemo(() => {
    if (!bias) return null;
    const { categoryWeights, severityMultipliers, params, weighted_overall } =
      bias;
    const gen = params?.generation?.toLowerCase();
    const occ = params?.occupation?.toLowerCase();
    const genFactorMap: Record<string, number> = {
      millennial: 1.0,
      "gen z": 0.98,
      "generation z": 0.98,
      "gen x": 0.97,
      "generation x": 0.97,
      boomer: 0.95,
      "baby boomer": 0.95,
    };
    const occFactorMap: Record<string, number> = {
      freelancer: 1.02,
      student: 0.99,
      manager: 1.01,
      designer: 1.0,
      developer: 1.0,
    };
    const genFactor = genFactorMap[gen ?? ""] ?? 1.0;
    const occFactor = occFactorMap[occ ?? ""] ?? 1.0;
    const weightSum = categoryWeights
      ? Object.values(categoryWeights).reduce(
          (a, b) => a + (typeof b === "number" ? b : 0),
          0
        )
      : 1;
    const severityVals = severityMultipliers
      ? Object.values(severityMultipliers).filter(
          (v): v is number => typeof v === "number"
        )
      : [];
    const severityAvg = severityVals.length
      ? severityVals.reduce((a, b) => a + b, 0) / severityVals.length
      : 1;
    const stabilizer =
      typeof weighted_overall === "number"
        ? clamp(weighted_overall, 0, 100) / 100
        : 1;
    const ageRange = generationToAgeRange(params?.generation);
    const formulaRaw =
      weightSum * ((genFactor + occFactor) / 2) * severityAvg * stabilizer;
    return {
      generation: params?.generation,
      occupation: params?.occupation,
      ageRange,
      genFactor,
      occFactor,
      weightSum,
      severityAvg,
      stabilizer,
      formulaRaw,
      parameterAvg,
    };
  }, [bias, parameterAvg]);

  const tripleOverall = useMemo(() => {
    const a = Number.isFinite(overallHeuristicsAvg) ? overallHeuristicsAvg : 0;
    const b = Number.isFinite(overallCategoriesAvg) ? overallCategoriesAvg : 0;
    const c = Number.isFinite(parameterAvg) ? parameterAvg : 0;
    return Math.round((a + b + c) / 3);
  }, [overallHeuristicsAvg, overallCategoriesAvg, parameterAvg]);

  useEffect(() => {
    if (selected) {
      console.log("Bias params:", selected?.ai?.bias?.params?.generation);
      console.log("Bias object:", selected?.ai?.bias);
    }
  }, [selected]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-7xl max-h-[85vh] bg-white dark:bg-[#232323] rounded-lg shadow-xl border border-[#ED5E20]/40 flex flex-col">
        {/* Local keyframes for animated stripes */}
        <style>
          {`
           @keyframes barStripes {
             from { background-position: 0 0; }
             to { background-position: 200% 0; }
           }
         `}
        </style>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="mt-4 mb-4">
              <h2
                id="weaknesses-title"
                className="text-2xl sm:text-3xl font-bold gradient-text truncate"
              >
                Computational Breakdown
              </h2>
            </div>
            {selected?.name ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • {selected.name}
              </span>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-full text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left: frame list */}
          <aside className="w-64 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Frames
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                  {frames.length} total
                </div>
              </div>
              <div className="space-y-1">
                {frames.length === 0 && !loading && (
                  <EmptyState message="No frames available." />
                )}
                {loading && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    Loading…
                  </div>
                )}
                {frames.map((f, idx) => {
                  const label = `Frame ${idx + 1}`;
                  const combined = f.ai?.debug_calc?.combined;
                  const overall =
                    typeof combined === "number"
                      ? combined
                      : displayOverallFor(f.ai);
                  return (
                    <button
                      key={f.id}
                      className={`w-full text-left px-3 py-2 rounded border ${
                        selectedId === f.id
                          ? "border-[#ED5E20] bg-[#ED5E20]/5 dark:bg-[#ED5E20]/10 text-[#ED5E20]"
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => setSelectedId(f.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                          {label}
                        </div>
                        {overall != null && (
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#ED5E20]/10 text-[#ED5E20]">
                            Overall {Math.round(overall)}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right: details */}
          <section className="flex-1 overflow-y-auto">
            {!selected && (
              <EmptyState message="Select a frame to view breakdown." />
            )}
            {selected && (
              <div className="p-5 space-y-6">
                {/* Category Scores */}
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                      <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                        Category Scores
                      </CardTitle>
                    </div>
                    {typeof selected.ai?.debug_calc?.combined === "number" && (
                      <div className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                        {categoriesList.length > 0 && (
                          <div className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                            <Chip tone={toneForScore(overallCategoriesAvg)}>
                              Categories Avg: {overallCategoriesAvg}%
                            </Chip>
                          </div>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {categoriesList.length === 0 ? (
                      <EmptyState message="No category scores." />
                    ) : (
                      <div className="space-y-3">
                        {categoriesList.map(({ key, value }) => (
                          <div
                            key={key}
                            className="grid grid-cols-12 gap-3 items-center"
                          >
                            <div className="col-span-3 md:col-span-2 text-xs md:text-sm text-gray-600 dark:text-gray-300 capitalize">
                              {key}
                            </div>
                            <div className="col-span-7 md:col-span-8">
                              <Bar value={value} />
                            </div>
                            <div className="col-span-2 text-right text-xs md:text-sm text-gray-700 dark:text-gray-200">
                              <Chip tone={toneForScore(value)}>
                                {clamp(Math.round(value), 0, 100)}%
                              </Chip>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Heuristic Breakdown */}
                <div>
                  {!hasHeuristics ? (
                    <EmptyState message="No heuristic breakdown provided." />
                  ) : (
                    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                            Heuristic Breakdown
                          </CardTitle>
                        </div>
                        <SearchCheck className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>

                      <CardContent>
                        <ScrollArea className="rounded-md border border-gray-100 dark:border-gray-800">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                                <TableHead className="text-left px-3 py-2 w-16 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Code
                                </TableHead>
                                <TableHead className="text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Principle
                                </TableHead>
                                <TableHead className="text-left px-3 py-2 w-24 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Score
                                </TableHead>
                                <TableHead className="text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Focus
                                </TableHead>
                                <TableHead className="text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Justification
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {heuristicBreakdown.map((h, idx) => {
                                const pct = percentFromHeuristic(h);
                                return (
                                  <TableRow
                                    key={`${h.code}-${idx}`}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                                  >
                                    <TableCell className="px-3 py-3 font-mono text-sm text-gray-800 dark:text-gray-200 text-center align-top whitespace-nowrap">
                                      {h.code}
                                    </TableCell>

                                    <TableCell className="px-3 py-2 text-gray-800 dark:text-gray-200 align-top">
                                      {h.principle}
                                    </TableCell>

                                    <TableCell className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200 align-top">
                                      {clamp(
                                        Math.round(h.score),
                                        0,
                                        h.max_points
                                      )}{" "}
                                      / {h.max_points}{" "}
                                      <span className="text-xs text-muted-foreground">
                                        ({pct}%)
                                      </span>
                                    </TableCell>

                                    <TableCell className="px-3 py-2 text-gray-600 dark:text-gray-300 align-top whitespace-normal break-words">
                                      {h.evaluation_focus || "-"}
                                    </TableCell>

                                    <TableCell className="px-3 py-2 text-gray-700 dark:text-gray-200 align-top whitespace-normal break-words max-w-[600px]">
                                      {h.justification || "-"}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                  {/* Computation Details Toggle */}
                  {hasHeuristics && (
                    <div className="mt-3 space-y-5 text-xs">
                      {/* Heuristic percents */}
                      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                            <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                              Heuristic Percentages
                            </CardTitle>
                          </div>
                          <Percent className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>

                        <CardContent>
                          <ScrollArea className="rounded-md border border-gray-100 dark:border-gray-800">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                                  <TableHead className="text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Code
                                  </TableHead>
                                  <TableHead className="text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Principle
                                  </TableHead>
                                  <TableHead className="text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Score
                                  </TableHead>
                                  <TableHead className="text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Percent
                                  </TableHead>
                                  <TableHead className="text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mapped Category
                                  </TableHead>
                                </TableRow>
                              </TableHeader>

                              <TableBody>
                                {heuristicPercents.map((h, idx) => (
                                  <TableRow
                                    key={`${h.code}-${idx}`}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                                  >
                                    <TableCell className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                      {h.code}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-800 dark:text-gray-200">
                                      {h.principle}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-800 dark:text-gray-200">
                                      {h.raw}
                                    </TableCell>
                                    <TableCell className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                      {h.percent}%
                                    </TableCell>
                                    <TableCell className="capitalize text-sm text-gray-700 dark:text-gray-300">
                                      {h.category === "n/a" ? "-" : h.category}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>

                          {/* Heuristics Avg summary */}
                          <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-[#ED5E20]" />
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                  Heuristics Avg
                                </span>
                              </div>
                              <Chip tone={toneForScore(overallHeuristicsAvg)}>
                                {overallHeuristicsAvg}%
                              </Chip>
                            </div>

                            {/* Gradient meter */}
                            <div className="mt-2 relative h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                              <div
                                className="h-full rounded-full relative transition-[width] duration-500 ease-out"
                                style={{
                                  width: `${overallHeuristicsAvg}%`,
                                  background: `linear-gradient(90deg, hsl(${Math.round(
                                    (overallHeuristicsAvg / 100) * 120
                                  )} 85% 55%), hsl(${Math.round(
                                    (overallHeuristicsAvg / 100) * 120
                                  )} 85% 55%))`,
                                  boxShadow: `0 0 0 2px hsl(${Math.round(
                                    (overallHeuristicsAvg / 100) * 120
                                  )} 90% 65% / .25), 0 0 14px hsl(${Math.round(
                                    (overallHeuristicsAvg / 100) * 120
                                  )} 90% 50% / .45)`,
                                }}
                              >
                                <div
                                  className="absolute inset-0 opacity-25 pointer-events-none"
                                  style={{
                                    backgroundImage:
                                      "repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 10px, transparent 10px 20px)",
                                    backgroundSize: "200% 100%",
                                    animation: "barStripes 4s linear infinite",
                                  }}
                                />
                              </div>
                            </div>

                            <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                              Based on {heuristicPercents.length} heuristics
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <div
                        className="mt-4 relative overflow-hidden rounded-2xl p-6 border bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm
                                       border-orange-200/60 dark:border-orange-400/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,.15)]
                                       ring-1 ring-white/40 dark:ring-white/5"
                      >
                        {/* Animated glow accents */}
                        <div className="pointer-events-none absolute -top-20 -left-24 h-56 w-56 rounded-full bg-gradient-to-br from-orange-400/25 via-amber-300/20 to-transparent blur-2xl animate-pulse" />
                        <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-400/20 via-teal-300/10 to-transparent blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
                        <div className="relative z-10 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow">
                                <Percent className="h-4 w-4" />
                              </span>
                              <span className="text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100">
                                Heuristic & Category Averages
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-2">
                              <Chip
                                tone={toneForScore(overallHeuristicsAvg)}
                                title="Mean of all individual heuristic percentages"
                              >
                                Heuristics: {overallHeuristicsAvg}%
                              </Chip>
                              <Chip
                                tone={toneForScore(overallCategoriesAvg)}
                                title="Mean of reported category scores"
                              >
                                Categories: {overallCategoriesAvg}%
                              </Chip>
                              <Chip
                                tone={toneForScore(combinedOverall)}
                                title="Midpoint of heuristics & categories"
                              >
                                Combined: {combinedOverall}%
                              </Chip>
                            </div>
                          </div>

                          {/* Unified comparison rail */}
                          <div className="space-y-2">
                            <div className="relative h-4 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 overflow-hidden ring-1 ring-white/40 dark:ring-black/30">
                              {/* Heuristics fill */}
                              <div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                  width: `${overallHeuristicsAvg}%`,
                                  background: `linear-gradient(90deg,hsl(${Math.round(
                                    (overallHeuristicsAvg / 100) * 120
                                  )} 85% 55%),hsl(${Math.round(
                                    (overallHeuristicsAvg / 100) * 120
                                  )} 85% 55%))`,
                                  boxShadow:
                                    "0 0 0 1px rgba(255,255,255,.4), 0 0 14px -2px rgba(0,0,0,.35)",
                                }}
                                aria-label="Heuristics Average Fill"
                              />
                              {/* Categories overlay */}
                              <div
                                className="absolute inset-y-0 left-0 rounded-full mix-blend-multiply dark:mix-blend-screen"
                                style={{
                                  width: `${overallCategoriesAvg}%`,
                                  background:
                                    "linear-gradient(90deg, rgba(99,102,241,.38), rgba(59,130,246,.38))",
                                }}
                                aria-label="Categories Average Overlay"
                              />
                              {/* Combined marker */}
                              <div
                                className="absolute top-0 bottom-0 w-[3px] -ml-[1.5px] rounded bg-emerald-400 shadow-[0_0_0_2px_rgba(255,255,255,.5),0_0_10px_rgba(16,185,129,.55)]"
                                style={{ left: `${combinedOverall}%` }}
                                aria-label="Combined Midpoint"
                              />
                              {/* Soft shimmer */}
                              <div
                                className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none animate-[shimmer_5s_linear_infinite]"
                                style={{
                                  background:
                                    "linear-gradient(110deg, transparent 0%, rgba(255,255,255,.65) 45%, transparent 60%)",
                                  backgroundSize: "200% 100%",
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] font-medium text-gray-500 dark:text-gray-400">
                              <span>0%</span>
                              <span>{combinedOverall}% (Combined)</span>
                              <span>100%</span>
                            </div>
                          </div>

                          {/* Mini dual bars */}
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="p-3 rounded-lg bg-gray-100/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                Heuristics Distribution
                              </span>
                              <div className="mt-2 h-2.5 rounded-full bg-gray-300/60 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full relative transition-[width] duration-500"
                                  style={{
                                    width: `${overallHeuristicsAvg}%`,
                                    background: `linear-gradient(90deg,hsl(${Math.round(
                                      (overallHeuristicsAvg / 100) * 120
                                    )} 85% 55%),hsl(${Math.round(
                                      (overallHeuristicsAvg / 100) * 120
                                    )} 85% 55%))`,
                                  }}
                                >
                                  <div
                                    className="absolute inset-0 opacity-25"
                                    style={{
                                      backgroundImage:
                                        "repeating-linear-gradient(45deg, rgba(255,255,255,.4) 0 8px, transparent 8px 16px)",
                                      backgroundSize: "200% 100%",
                                      animation:
                                        "barStripes 4s linear infinite",
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                                Mean {overallHeuristicsAvg}%
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-gray-100/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                Categories Distribution
                              </span>
                              <div className="mt-2 h-2.5 rounded-full bg-gray-300/60 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full relative transition-[width] duration-500"
                                  style={{
                                    width: `${overallCategoriesAvg}%`,
                                    background:
                                      "linear-gradient(90deg, rgba(99,102,241,.55), rgba(59,130,246,.55))",
                                  }}
                                >
                                  <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                      backgroundImage:
                                        "repeating-linear-gradient(45deg, rgba(255,255,255,.4) 0 8px, transparent 8px 16px)",
                                      backgroundSize: "180% 100%",
                                      animation:
                                        "barStripes 5s linear infinite",
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                                Mean {overallCategoriesAvg}%
                              </div>
                            </div>
                          </div>

                          {/* Legend */}
                          <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <span
                                className="h-2 w-4 rounded-sm"
                                style={{
                                  background: `hsl(${Math.round(
                                    (overallHeuristicsAvg / 100) * 120
                                  )} 85% 55%)`,
                                }}
                              />
                              Heuristics
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="h-2 w-4 rounded-sm bg-indigo-400/70" />
                              Categories
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="h-2 w-[3px] rounded bg-emerald-400" />
                              Combined
                            </div>
                            <div className="ml-auto">
                              Based on {heuristicPercents.length} heuristics
                            </div>
                          </div>
                        </div>

                        {/* Extra keyframes (scoped) */}
                        <style>
                          {`
                                @keyframes shimmer {
                                  0% { background-position: 0% 50%; }
                                  100% { background-position: 200% 50%; }
                                }
                                @keyframes pulse {
                                  0%,100% { opacity:.55; }
                                  50% { opacity:.9; }
                                }
                              `}
                        </style>
                      </div>
                      {/* Derived categories vs original */}
                      <div>
                        <Card className="border-2 border-[#ED5E20]/30 bg-gradient-to-br from-white to-orange-50 dark:from-white/5 dark:to-[#ED5E20]/10 shadow-sm">
                          <CardHeader className="pb-3 flex items-center gap-2">
                            <span className="h-6 w-1.5 rounded-full bg-[#ED5E20]" />
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              <Info className="h-4 w-4 text-[#ED5E20]" />
                              What do “Derived” and “Original” mean?
                            </CardTitle>
                          </CardHeader>

                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Derived */}
                              <div className="space-y-1">
                                <Chip tone="accent">Derived</Chip>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  Average of heuristic percentages mapped to
                                  each category.
                                </p>
                              </div>

                              {/* Original */}
                              <div className="space-y-1">
                                <Chip tone="info">Original</Chip>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  Category scores reported by the evaluator for
                                  this frame.
                                </p>
                              </div>
                            </div>

                            {/* Expandable Section */}
                            <details className="mt-4 group">
                              <summary className="list-none cursor-pointer flex items-center gap-2 text-sm font-medium text-[#ED5E20] hover:underline">
                                <span>See mapping</span>
                                <ChevronRight
                                  size={14}
                                  className="transition-transform duration-200 group-open:rotate-90 text-[#ED5E20]"
                                />
                              </summary>

                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                  "accessibility",
                                  "usability",
                                  "layout",
                                  "hierarchy",
                                ].map((cat) => (
                                  <Card
                                    key={cat}
                                    className="border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-white/5 p-3 transition-colors hover:border-[#ED5E20]/40 hover:bg-orange-50/50 dark:hover:bg-[#ED5E20]/10"
                                  >
                                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                                      <ClipboardCheck className="h-3 w-3 text-[#ED5E20]" />
                                      {cat}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(categoryToCodes[cat] || []).length >
                                      0 ? (
                                        categoryToCodes[cat].map((code) => (
                                          <span
                                            key={code}
                                            className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                          >
                                            {code}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[11px] text-gray-400">
                                          —
                                        </span>
                                      )}
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </details>
                          </CardContent>
                        </Card>

                        {derivedCategoryFromHeuristics.length === 0 ? (
                          <div className="text-gray-500 dark:text-gray-400">
                            No mappable heuristics.
                          </div>
                        ) : (
                          <Card className="border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-white/5 shadow-sm mt-4">
                            <CardHeader className="flex items-center justify-between pb-4">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                  Category Comparison
                                </CardTitle>
                              </div>
                            </CardHeader>

                            <CardContent>
                              <div className="space-y-4">
                                {derivedCategoryFromHeuristics.map((c) => {
                                  const original = (categories as any)[
                                    c.key
                                  ] as number | undefined;
                                  return (
                                    <div
                                      key={c.key}
                                      className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 hover:bg-gray-100/80 dark:hover:bg-gray-900/60 transition-colors"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold capitalize text-gray-700 dark:text-gray-200">
                                            {c.key}
                                          </span>
                                        </div>
                                      </div>

                                      <TwinBar
                                        key={c.key}
                                        label={""}
                                        derived={c.avg}
                                        original={original}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {personaMetrics && (
                        <Card className="border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-white/5 shadow-sm backdrop-blur-sm">
                          <CardHeader className="flex items-center gap-3 pb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/70 to-teal-500/70 text-white shadow ring-2 ring-white/40 dark:ring-emerald-400/30">
                              <Info className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <CardTitle className="text-xl font-semibold tracking-wide text-gray-900 dark:text-gray-100">
                                Persona Parameters
                              </CardTitle>
                              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                Generation & Occupation weighting influence on
                                final score
                              </p>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-6 overflow-visible">
                            {/* Persona summary badges */}
                            <div className="flex flex-wrap gap-3">
                              {personaMetrics.ageRange ? (
                                <Chip tone="accent">
                                  Age Range: {personaMetrics.ageRange.min}–
                                  {personaMetrics.ageRange.max} (
                                  {personaMetrics.generation})
                                </Chip>
                              ) : personaMetrics.generation ? (
                                <Chip tone="accent">
                                  Generation: {personaMetrics.generation}
                                </Chip>
                              ) : null}
                              {personaMetrics.occupation && (
                                <Chip tone="info">
                                  Occupation: {personaMetrics.occupation}
                                </Chip>
                              )}
                              <Chip tone="muted">
                                Weight Sum:{" "}
                                {personaMetrics.weightSum.toFixed(3)}
                              </Chip>
                              <Chip tone="muted">
                                Severity Avg:{" "}
                                {personaMetrics.severityAvg.toFixed(2)}
                              </Chip>
                            </div>

                            {/* Compact metric overview boxes */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <PersonaMetricBox
                                label="Gen Factor"
                                value={personaMetrics.genFactor.toFixed(2)}
                                accent="from-violet-500 to-fuchsia-500"
                              />
                              <PersonaMetricBox
                                label="Occ Factor"
                                value={personaMetrics.occFactor.toFixed(2)}
                                accent="from-sky-500 to-indigo-500"
                              />
                              <PersonaMetricBox
                                label="Severity Avg"
                                value={personaMetrics.severityAvg.toFixed(2)}
                                accent="from-orange-500 to-amber-500"
                              />
                              <PersonaMetricBox
                                label="Weight Sum"
                                value={personaMetrics.weightSum.toFixed(3)}
                                accent="from-emerald-500 to-teal-500"
                              />
                              <PersonaMetricBox
                                label="Stabilizer"
                                value={personaMetrics.stabilizer.toFixed(2)}
                                accent="from-cyan-500 to-blue-500"
                              />
                              <PersonaMetricBox
                                label="Raw Product"
                                value={personaMetrics.formulaRaw.toFixed(4)}
                                accent="from-lime-500 to-green-500"
                              />
                            </div>

                            {/* Toggle button */}
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setShowPersonaDetails((v) => !v)}
                                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold  text-white shadow-sm transition"
                              >
                                {showPersonaDetails
                                  ? "Hide Details"
                                  : "See More Details"}
                                <ChevronRight
                                  className={`h-3 w-3 transition-transform ${
                                    showPersonaDetails ? "rotate-90" : ""
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Expanded explanations */}
                            {showPersonaDetails && (
                              <div className="space-y-5 rounded-xl border border-emerald-300/50 dark:border-emerald-700/40 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 dark:from-emerald-900/30 dark:to-teal-900/20 p-6 shadow-md">
                                <div className="flex items-center gap-2 mb-3">
                                  <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                                  <span className="text-base font-semibold text-emerald-700 dark:text-emerald-200">
                                    Metric Definitions
                                  </span>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 text-sm leading-relaxed">
                                  <DefinitionItem
                                    title="Gen Factor"
                                    desc="Adjustment based on generation baseline sensitivity (Millennial = 1.00; older cohorts slightly lower)."
                                    examples={[
                                      "Millennial 1.00",
                                      "Gen Z 0.98",
                                      "Gen X 0.97",
                                      "Baby Boomer 0.95",
                                    ]}
                                  />
                                  <DefinitionItem
                                    title="Occ Factor"
                                    desc="Modifier for occupation efficiency or tolerance (higher for time‑sensitive independent work)."
                                    examples={[
                                      "Freelancer 1.02",
                                      "Manager 1.01",
                                      "Designer 1.00",
                                      "Developer 1.00",
                                      "Student 0.99",
                                    ]}
                                  />
                                  <DefinitionItem
                                    title="Weight Sum"
                                    desc="Sum of all categoryWeights (should ≈ 1.00 for balanced influence)."
                                    examples={Object.entries(
                                      bias?.categoryWeights || {}
                                    ).map(
                                      ([k, v]) =>
                                        `${k}: ${(Number(v) * 100).toFixed(1)}%`
                                    )}
                                  />
                                  <DefinitionItem
                                    title="Severity Avg"
                                    desc="Average of severityMultipliers (content, usability, accessibility)."
                                    examples={Object.entries(
                                      bias?.severityMultipliers || {}
                                    ).map(
                                      ([k, v]) =>
                                        `${k}: ${Number(v).toFixed(2)}`
                                    )}
                                  />
                                  <DefinitionItem
                                    title="Stabilizer"
                                    desc="Normalization factor from weighted_overall (score ÷ 100) to reduce variance."
                                    examples={[
                                      `weighted_overall: ${
                                        typeof bias?.weighted_overall ===
                                        "number"
                                          ? bias.weighted_overall
                                          : "—"
                                      }`,
                                    ]}
                                  />
                                  <DefinitionItem
                                    title="Raw Product"
                                    desc="Unscaled multiplicative blend before converting to %."
                                    examples={[
                                      `${personaMetrics.weightSum.toFixed(
                                        3
                                      )} × ${(
                                        (personaMetrics.genFactor +
                                          personaMetrics.occFactor) /
                                        2
                                      ).toFixed(
                                        2
                                      )} × ${personaMetrics.severityAvg.toFixed(
                                        2
                                      )} × ${personaMetrics.stabilizer.toFixed(
                                        2
                                      )}`,
                                    ]}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Formula block */}
                            <div className="rounded-xl border border-emerald-300/40 dark:border-emerald-600/30 bg-gradient-to-br from-emerald-50/70 to-teal-50/60 dark:from-emerald-900/20 dark:to-teal-900/15 p-5 shadow-sm relative overflow-hidden">
                              <div className="absolute -top-8 -right-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
                              <div className="flex items-center gap-2 mb-2">
                                <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                                <span className="text-base font-semibold tracking-wide text-emerald-700 dark:text-emerald-200">
                                  Parameter Average Computation
                                </span>
                              </div>
                              <code
                                className="block font-mono text-[13px] md:text-sm leading-relaxed text-gray-800 dark:text-gray-100
                                font-[STIX Two Math,Cambria Math,Latin Modern Math,Noto Sans Math,Times New Roman,serif]
                                tracking-wide"
                              >
                                <span className="whitespace-pre-wrap">
                                  <span className="italic font-semibold text-emerald-800 dark:text-emerald-200">
                                    ParameterAvg
                                  </span>
                                  <span className="mx-1">=</span>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    round(
                                  </span>
                                  <span className="italic text-teal-700 dark:text-teal-300">
                                    WeightSum
                                  </span>
                                  <span className="mx-1 font-bold text-emerald-600 dark:text-emerald-300">
                                    ×
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    (
                                  </span>
                                  <span className="italic text-violet-700 dark:text-violet-300">
                                    GenFactor
                                  </span>
                                  <span className="mx-1 text-gray-600 dark:text-gray-400">
                                    +
                                  </span>
                                  <span className="italic text-indigo-700 dark:text-indigo-300">
                                    OccFactor
                                  </span>
                                  <span className="mx-1 text-gray-700 dark:text-gray-300">
                                    )
                                  </span>
                                  <span className="mx-1 text-gray-700 dark:text-gray-300">
                                    / 2
                                  </span>
                                  <span className="mx-1 font-bold text-emerald-600 dark:text-emerald-300">
                                    ×
                                  </span>
                                  <span className="italic text-amber-700 dark:text-amber-300">
                                    SeverityAvg
                                  </span>
                                  <span className="mx-1 font-bold text-emerald-600 dark:text-emerald-300">
                                    ×
                                  </span>
                                  <span className="italic text-green-700 dark:text-green-300">
                                    Stabilizer
                                  </span>
                                  <span className="mx-1 font-bold text-emerald-600 dark:text-emerald-300">
                                    ×
                                  </span>
                                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                                    100
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    )
                                  </span>
                                </span>
                                <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-400">
                                  All factors are multiplicative; generation and
                                  occupation are averaged before application.
                                </div>
                              </code>
                              <div className="mt-3 flex items-center gap-3">
                                <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                                  Result:
                                </span>
                                <Chip
                                  tone="pos"
                                  title="Final persona-influenced average"
                                >
                                  {personaMetrics.parameterAvg}%
                                </Chip>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Overall formula */}
                      <Card className="border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-white/5 shadow-sm">
                        <CardHeader className="flex items-center gap-2 pb-3">
                          <Calculator className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Overall Breakdown
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-5 overflow-visible">
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-base font-medium text-gray-700 dark:text-gray-200">
                                Step 1: Sum of three
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-gray-800 dark:text-gray-200">
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                                Heuristics Avg: {overallHeuristicsAvg}%
                              </span>
                              <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                                Categories Avg: {overallCategoriesAvg}%
                              </span>
                              <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                                Parameters Avg: {parameterAvg}%
                              </span>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-base font-medium text-gray-700 dark:text-gray-200">
                                Step 2: Combine (Mean of three)
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-gray-800 dark:text-gray-200">
                              {/* Parenthesized expression for clarity */}
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300">
                                (
                              </span>
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                                {overallHeuristicsAvg}%
                              </span>
                              <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                                {overallCategoriesAvg}%
                              </span>
                              <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                                {parameterAvg}%
                              </span>
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300">
                                )
                              </span>
                              <Divide className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                                3
                              </span>
                              <Equal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                                {tripleOverall}%
                              </span>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-gray-50 dark:from-emerald-900/20 dark:to-gray-900/40 border border-emerald-200/60 dark:border-emerald-800/60">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-base font-base text-gray-700 dark:text-gray-200">
                                Step 3: Final Score
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-base font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                              <Calculator className="h-4 w-4" />
                              <span className="sr-only">Final Overall</span>
                              <ScoreBadge
                                value={tripleOverall}
                                label="Final Overall"
                              />
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                              Incorporates persona parameter influence
                              (generation & occupation) via category weights and
                              multipliers.
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

function toneForScore(v: number): "pos" | "info" | "muted" | "neg" {
  const n = Math.round(Number.isFinite(v) ? v : 0);
  if (n >= 85) return "pos";
  if (n >= 70) return "info";
  if (n >= 50) return "muted";
  return "neg";
}

const PersonaMetricBox: React.FC<{
  label: string;
  value: string;
  accent?: string;
}> = ({ label, value, accent = "from-emerald-500 to-teal-500" }) => (
  <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/50 p-3 shadow-sm">
    <div
      className={`absolute inset-0 rounded-lg pointer-events-none bg-gradient-to-br ${accent} opacity-[0.07]`}
    />
    <div className="relative flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  </div>
);

const DefinitionItem: React.FC<{
  title: string;
  desc: string;
  examples?: string[];
}> = ({ title, desc, examples = [] }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1">
      <span className="text-[13px] md:text-sm font-bold text-emerald-700 dark:text-emerald-300">
        {title}
      </span>
    </div>
    <p className="text-[13px] md:text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
      {desc}
    </p>
    {examples.length > 0 && (
      <ul className="mt-1 space-y-0.5 text-[12px] text-gray-600 dark:text-gray-400">
        {examples.map((e) => (
          <li key={e} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-emerald-500 dark:text-emerald-300" />
            {e}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Chip: React.FC<{
  children: React.ReactNode;
  tone?: "accent" | "info" | "muted" | "pos" | "neg";
}> = ({ children, tone = "muted" }) => {
  // Unified bigger size + tone-specific gradients and rings (light/dark aware)
  const base =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm";
  const toneCls =
    tone === "accent"
      ? "bg-gradient-to-r from-emerald-500/16 via-teal-500/16 to-sky-500/16 text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-500/30"
      : tone === "info"
      ? "bg-gradient-to-r from-sky-500/16 via-blue-500/16 to-indigo-500/16 text-sky-700 dark:text-sky-200 ring-1 ring-sky-500/30"
      : tone === "pos"
      ? "bg-gradient-to-r from-green-500/16 via-emerald-500/16 to-lime-500/16 text-green-700 dark:text-green-200 ring-1 ring-green-500/30"
      : tone === "neg"
      ? "bg-gradient-to-r from-rose-500/16 via-red-500/16 to-orange-500/16 text-rose-700 dark:text-rose-200 ring-1 ring-rose-500/30"
      : "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-gray-300/40 dark:ring-gray-700/40";
  return <span className={`${base} ${toneCls}`}>{children}</span>;
};

const TwinBar: React.FC<{
  label: string;
  derived: number;
  original?: number | null;
}> = ({ label, derived, original }) => {
  const d = clamp(Math.round(derived || 0), 0, 100);
  const o = clamp(Math.round(original ?? 0), 0, 100);
  const hasOriginal = typeof original === "number";
  // const delta = hasOriginal ? d - o : null;
  const hue = Math.round((d / 100) * 120);
  const fillD = `hsl(${hue} 85% 55%)`;
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-4 capitalize text-gray-700 dark:text-gray-200">
        {label}
      </div>
      <div className="col-span-6">
        <div className="relative h-3 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          {hasOriginal && (
            <div
              className="absolute inset-y-0 left-0 bg-blue-500/50"
              style={{ width: `${o}%` }}
              aria-label="Original"
            />
          )}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${d}%`,
              background: fillD,
              boxShadow: `0 0 10px ${fillD}55`,
            }}
            aria-label="Derived"
          />
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 8px, transparent 8px 16px)",
            }}
          />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Chip tone="accent">Derived {d}%</Chip>
          {hasOriginal && <Chip tone="info">Original {o}%</Chip>}
          {/* {hasOriginal && delta !== null && (
            <Chip tone={delta >= 0 ? "pos" : "neg"}>
              Δ {delta >= 0 ? `+${delta}%` : `${delta}%`}
            </Chip>
          )} */}
        </div>
      </div>
    </div>
  );
};

const ScoreBadge: React.FC<{ value: number; label?: string }> = ({
  value,
  label = "Score",
}) => {
  const pct = Math.round(value);
  return (
    <span
      className="relative inline-flex items-center rounded-md px-3 py-1.5
                 bg-white/95 dark:bg-gray-900/70
                 text-emerald-700 dark:text-emerald-300
                 font-semibold tracking-tight shadow-sm ring-1 ring-emerald-400/40
                 transition-colors"
      aria-label={`${label} ${pct} percent`}
      title={`${label}: ${pct}%`}
    >
      {pct}%
      <span
        aria-hidden
        className="absolute inset-0 rounded-md pointer-events-none badge-glow"
      />
    </span>
  );
};

// Append (or merge) style block once (place after existing <style> with keyframes)
<style>
  {`
@media (prefers-reduced-motion: no-preference) {
  .badge-glow {
    box-shadow:
      0 0 0 2px rgba(16,185,129,0.18),
      0 0 12px -2px rgba(16,185,129,0.35),
      inset 0 0 0 1px rgba(16,185,129,0.25);
    animation: badgePulse 5s ease-in-out infinite;
  }
  @keyframes badgePulse {
    0%,100% {
      box-shadow:
        0 0 0 2px rgba(16,185,129,0.18),
        0 0 10px -2px rgba(16,185,129,0.30),
        inset 0 0 0 1px rgba(16,185,129,0.22);
    }
    50% {
      box-shadow:
        0 0 0 2px rgba(16,185,129,0.30),
        0 0 18px -2px rgba(16,185,129,0.55),
        inset 0 0 0 1px rgba(16,185,129,0.28);
    }
  }
}
/* High contrast outline on forced-colors (Windows High Contrast) */
@media (forced-colors: active) {
  .badge-glow {
    box-shadow: 0 0 0 2px CanvasText;
  }
}
`}
</style>;

export default ComputationalBreakdown;
