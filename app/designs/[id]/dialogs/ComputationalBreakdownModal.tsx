import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

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
  return (
    <div className="w-full h-2 rounded bg-gray-200 overflow-hidden">
      <div
        className="h-full bg-[#ED5E20] transition-all"
        style={{ width: `${v}%` }}
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

  const Bar = ({ value }: { value: number }) => {
    const v = clamp(Math.round(value || 0), 0, 100);
    return (
      <div className="w-full h-2 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-[#ED5E20] transition-all"
          style={{ width: `${v}%` }}
        />
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
      {message}
    </div>
  );
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/60"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-6xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Computational Breakdown
            </span>
            {selected?.name ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • {selected.name}
              </span>
            ) : null}
          </div>
          <button
            aria-label="Close"
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left: frame list */}
          <aside className="w-64 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            <div className="p-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Frames
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
                {frames.map((f) => (
                  <button
                    key={f.id}
                    className={`w-full text-left px-3 py-2 rounded border ${
                      selectedId === f.id
                        ? "border-[#ED5E20] bg-[#ED5E20]/5 dark:bg-[#ED5E20]/10 text-[#ED5E20]"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setSelectedId(f.id)}
                  >
                    <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                      {f.name || f.id}
                    </div>
                    {typeof f.ai?.overall_score === "number" && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Overall: {Math.round(f.ai.overall_score)}
                      </div>
                    )}
                  </button>
                ))}
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
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Category Scores
                    </h3>
                    {typeof selected.ai?.overall_score === "number" && (
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Overall:{" "}
                        <span className="font-medium">
                          {Math.round(selected.ai.overall_score)}
                        </span>
                      </div>
                    )}
                  </div>
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
                            {clamp(Math.round(value), 0, 100)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Heuristic Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Heuristic Breakdown
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Max points per row are normalized to percentages.
                    </div>
                  </div>
                  {!hasHeuristics ? (
                    <EmptyState message="No heuristic breakdown provided." />
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          <tr>
                            <th className="text-left px-3 py-2 w-16">Code</th>
                            <th className="text-left px-3 py-2">Principle</th>
                            <th className="text-left px-3 py-2 w-24">Score</th>
                            <th className="text-left px-3 py-2">Focus</th>
                            <th className="text-left px-3 py-2">
                              Justification
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {heuristicBreakdown.map((h, idx) => {
                            const pct = percentFromHeuristic(h);
                            return (
                              <tr
                                key={`${h.code}-${idx}`}
                                className="align-top"
                              >
                                <td className="px-3 py-2 font-mono text-xs text-gray-800 dark:text-gray-200">
                                  {h.code}
                                </td>
                                <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                                  {h.principle}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                  {clamp(Math.round(h.score), 0, h.max_points)}{" "}
                                  / {h.max_points} ({pct}%)
                                </td>
                                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                                  {h.evaluation_focus || "-"}
                                </td>
                                <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                  {h.justification || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Computation Details Toggle */}
                  {hasHeuristics && (
                    <div className="border rounded p-3 bg-gray-50 dark:bg-gray-800/40">
                      <button
                        className="text-xs font-medium text-[#ED5E20] hover:underline"
                        onClick={() => setShowCalc((v) => !v)}
                      >
                        {showCalc ? "Hide" : "Show"} Computation Details
                      </button>
                      {showCalc && (
                        <div className="mt-3 space-y-5 text-xs">
                          {/* Heuristic percents */}
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
                              Heuristic Percentages
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                  <tr>
                                    <th className="px-2 py-1 text-left">
                                      Code
                                    </th>
                                    <th className="px-2 py-1 text-left">
                                      Principle
                                    </th>
                                    <th className="px-2 py-1 text-left">Raw</th>
                                    <th className="px-2 py-1 text-left">
                                      Percent
                                    </th>
                                    <th className="px-2 py-1 text-left">
                                      Mapped Category
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {heuristicPercents.map((h) => (
                                    <tr key={h.code}>
                                      <td className="px-2 py-1 font-mono">
                                        {h.code}
                                      </td>
                                      <td className="px-2 py-1">
                                        {h.principle}
                                      </td>
                                      <td className="px-2 py-1">{h.raw}</td>
                                      <td className="px-2 py-1">
                                        {h.percent}%
                                      </td>
                                      <td className="px-2 py-1 capitalize">
                                        {h.category === "n/a"
                                          ? "-"
                                          : h.category}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Derived categories vs original */}
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
                              Derived Category Averages (from heuristics)
                            </h4>
                            {derivedCategoryFromHeuristics.length === 0 && (
                              <div className="text-gray-500 dark:text-gray-400">
                                No mappable heuristics.
                              </div>
                            )}
                            {derivedCategoryFromHeuristics.length > 0 && (
                              <div className="space-y-1">
                                {derivedCategoryFromHeuristics.map((c) => {
                                  const original = (categories as any)[c.key];
                                  return (
                                    <div
                                      key={c.key}
                                      className="grid grid-cols-12 gap-2 items-center"
                                    >
                                      <div className="col-span-4 capitalize text-gray-600 dark:text-gray-300">
                                        {c.key}
                                      </div>
                                      <div className="col-span-4 text-gray-700 dark:text-gray-200">
                                        Derived: {c.avg}%
                                      </div>
                                      <div className="col-span-4 text-gray-700 dark:text-gray-200">
                                        Original:{" "}
                                        {typeof original === "number"
                                          ? `${original}%`
                                          : "—"}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Overall formula */}
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
                              Overall Calculation
                            </h4>
                            <div className="space-y-4 text-xs md:text-sm">
                              {dbg ? (
                                <>
                                  {/* Step 1: Mean of Heuristics & Categories */}
                                  <EqRow>
                                    <Pill
                                      label="Heuristics Avg"
                                      value={dbg.heuristics_avg}
                                    />
                                    <EqSep op="+" />
                                    <Pill
                                      label="Categories Avg"
                                      value={dbg.categories_avg}
                                    />
                                    <EqSep op="÷ 2 =" />
                                    <Pill
                                      label="Combined"
                                      value={dbg.combined}
                                      variant="accent"
                                    />
                                  </EqRow>
                                  {/* Step 2: Progressive blend (if enabled) */}
                                  {dbg.alpha !== 0 && (
                                    <>
                                      <EqRow>
                                        <Pill
                                          label="Combined"
                                          value={dbg.combined}
                                        />
                                        <EqSep
                                          op="⊕"
                                          title="Blend towards target"
                                        />
                                        <Pill
                                          label="Target"
                                          value={dbg.target}
                                          variant="info"
                                        />
                                        <EqSep
                                          op={`α ${dbg.alpha}`}
                                          title="alpha"
                                        />
                                        <EqSep op="=" />
                                        <Pill
                                          label="Blended"
                                          value={dbg.blended}
                                          variant="purple"
                                        />
                                      </EqRow>
                                      {dbg.extra_pull_applied && (
                                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                          Extra pull applied ({">"}|15| from
                                          target)
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* Step 3: Final */}
                                  <EqRow>
                                    <Pill
                                      label={
                                        dbg.alpha === 0 ? "Combined" : "Blended"
                                      }
                                      value={
                                        dbg.alpha === 0
                                          ? dbg.combined
                                          : dbg.blended
                                      }
                                    />
                                    <EqSep op="→" />
                                    <Pill
                                      label="Final"
                                      value={dbg.final}
                                      variant="success"
                                    />
                                  </EqRow>
                                </>
                              ) : (
                                <>
                                  <EqRow>
                                    <Pill
                                      label="Heuristics Avg"
                                      value={overallHeuristicsAvg}
                                    />
                                    <EqSep op="+" />
                                    <Pill
                                      label="Categories Avg"
                                      value={overallCategoriesAvg}
                                    />
                                    <EqSep op="÷ 2 =" />
                                    <Pill
                                      label="Combined"
                                      value={combinedOverall}
                                      variant="accent"
                                    />
                                  </EqRow>
                                  <div className="text-gray-600 dark:text-gray-300">
                                    Displayed Overall = {combinedOverall}% (raw
                                    mean)
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
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

const Pill: React.FC<{
  label: string;
  value: number;
  variant?: "base" | "accent" | "info" | "purple" | "success";
}> = ({ label, value, variant = "base" }) => {
  const v = clamp(Math.round(value || 0), 0, 100);
  const cls =
    variant === "accent"
      ? "bg-[#ED5E20]/10 text-[#ED5E20]"
      : variant === "info"
      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
      : variant === "purple"
      ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
      : variant === "success"
      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${cls}`}>
      <span className="opacity-80">{label}:</span>
      <span className="font-medium">{v}%</span>
    </span>
  );
};

const EqSep: React.FC<{ op: string; title?: string }> = ({ op, title }) => (
  <span
    className="mx-1 md:mx-2 text-gray-500 dark:text-gray-400 select-none"
    title={title}
    aria-label={title}
  >
    {op}
  </span>
);

const EqRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-wrap items-center gap-1 md:gap-2">{children}</div>
);

export default ComputationalBreakdown;
