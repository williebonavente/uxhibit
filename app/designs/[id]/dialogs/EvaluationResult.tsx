import { useMemo, useState } from "react";
import { EvalResponse } from "../page";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EvaluationResultProps {
  evalResult: EvalResponse;
  loadingEval: boolean;
  currentFrame: any;
  frameEvaluations: any[];
  selectedFrameIndex: number;
}

const EvaluationResult: React.FC<EvaluationResultProps> = ({
  evalResult,
  loadingEval,
  currentFrame,
  frameEvaluations,
  selectedFrameIndex,
}) => {
  const mappedIndex = selectedFrameIndex < 0 ? 0 : selectedFrameIndex;
  const activeFrame = frameEvaluations[mappedIndex];
  const [
    isHoveringOverScoringLegendPopover,
    setIsHoveringOverScoringLegendPopover,
  ] = useState(false);

  const root = useMemo(() => {
    const aiData = activeFrame?.ai_data;
    if (!aiData) return {};
    const possible = (aiData as any).ai ?? aiData;
    return possible || {};
  }, [activeFrame]);

  const debugCalc = root?.debug_calc;

  // Heuristic Average
  const heurAvg =
    typeof debugCalc?.heuristics_avg === "number"
      ? debugCalc.heuristics_avg
      : undefined;

  const catScoresObj =
    (root as any)?.ai?.category_scores ??
    (root as any)?.category_scores ??
    undefined;

  const catNumbers = Array.isArray(catScoresObj)
    ? (catScoresObj as number[]).filter((n) => Number.isFinite(n))
    : catScoresObj && typeof catScoresObj === "object"
    ? Object.values(catScoresObj).filter(
        (v: any): v is number => typeof v === "number" && Number.isFinite(v)
      )
    : [];

  const catAvg =
    catNumbers.length > 0
      ? Math.round(
          catNumbers.reduce((sum, n) => sum + n, 0) / catNumbers.length
        )
      : undefined;


  // BiasWeighted Average
  const biasWeighted =
    typeof debugCalc?.bias_weighted_overall === "number"
      ? debugCalc.bias_weighted_overall
      : typeof (root as any)?.bias?.weighted_overall === "number"
      ? (root as any).bias.weighted_overall
      : undefined;

  const fallbackFromData = useMemo(() => {
    // mirror getFrameScore fallback
    const cats = root?.category_scores;
    let catsAvg: number | undefined;
    if (cats && typeof cats === "object") {
      const vals = Object.values(cats).filter(
        (v: any): v is number => typeof v === "number" && Number.isFinite(v)
      );
      if (vals.length)
        catsAvg = Math.round(
          vals.reduce((a: number, b: number) => a + b, 0) / vals.length
        );
    }
    const hb: any[] = Array.isArray(root?.heuristic_breakdown)
      ? root.heuristic_breakdown
      : [];
    let heurAvg: number | undefined;
    if (hb.length) {
      const pctSum = hb.reduce((acc, h) => {
        const s = typeof h.score === "number" ? h.score : 0;
        const m =
          typeof h.max_points === "number" && h.max_points > 0
            ? h.max_points
            : 4;
        return acc + (s / m) * 100;
      }, 0);
      heurAvg = Math.round(pctSum / hb.length);
    }
    if (typeof debugCalc?.final === "number") return debugCalc.final;
    if (typeof root?.overall_score === "number") return root.overall_score;
    if (typeof catsAvg === "number" && typeof heurAvg === "number")
      return Math.round((catsAvg + heurAvg) / 2);
    if (typeof catsAvg === "number") return catsAvg;
    if (typeof heurAvg === "number") return heurAvg;
    return 0;
  }, [root, debugCalc]);

  const customTriAverage =
    typeof heurAvg === "number" &&
    typeof catAvg === "number" &&
    typeof biasWeighted === "number"
      ? Math.round((heurAvg + catAvg + biasWeighted) / 3)
      : undefined;

  const score =
    typeof customTriAverage === "number"
      ? customTriAverage
      : typeof debugCalc?.final === "number"
      ? debugCalc.final
      : fallbackFromData;

  if (!evalResult || loadingEval) return null;

  const HEURISTIC_LABELS: Record<string, string> = {
    "01": "Visibility of System Status",
    "02": "Match Between System and the Real World",
    "03": "User Control and Freedom",
    "04": "Consistency and Standards",
    "05": "Error Prevention",
    "06": "Recognition Rather than Recall",
    "07": "Flexibility and Efficiency of Use",
    "08": "Aesthetic and Minimalist Design",
    "09": "Help Users Recognize, Diagnose, and Recover from Errors",
    "10": "Help and Documentation",
  };

  // const combinedMean =
  //   typeof debugCalc?.combined === "number" ? debugCalc.combined : undefined;
  // const score = Math.round(
  //   typeof combinedMean === "number" ? combinedMean : fallbackFromData
  // );

  // 4. If you also need category scores and heuristics for active frame:

  const title = `Frame ${mappedIndex + 1} Score`;

  const percent = Math.max(0, Math.min(score, 100));
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  let color = "#ED5E20";
  if (score >= 75) color = "#16A34A";
  else if (score < 50) color = "#DC2626";

  return (
    <>
      <div className="flex flex-col items-center justify-center p-6 mb-8">
        <div className="relative w-32 h-32 mb-3">
          <svg height="128" width="128">
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx="64"
              cy="64"
            />
            <circle
              stroke={color}
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference + " " + circumference}
              style={{
                strokeDashoffset,
                transition: "stroke-dashoffset 0.8s ease, stroke 0.3s",
              }}
              r={normalizedRadius}
              cx="64"
              cy="64"
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl font-extrabold"
            style={{ color }}
          >
            {score}
          </span>
        </div>
        <h3
          className="font-semibold text-center text-xl sm:text-2xl mb-1"
          style={{ color }}
        >
          {title}
        </h3>
        <span className="text-md text-neutral-500">out of 100</span>
      </div>

      {/* Summary */}
      {activeFrame?.summary && (
        <div className="p-5 rounded-2xl bg-[#2563EB]/10 dark:bg-[#60A5FA]/10 mb-5 shadow-md">
          <h3 className="font-bold mb-3 text-[#2563EB] dark:text-[#60A5FA] text-lg flex items-center gap-2">
            <span className="text-xl">💡</span>
            Summary
          </h3>
          <p className="text-neutral-900 dark:text-neutral-100 leading-8">
            {activeFrame.summary}
          </p>
        </div>
      )}
      {/* Strengths */}
      {Array.isArray(evalResult.strengths) &&
        evalResult.strengths.length > 0 && (
          <div className="p-5 rounded-2xl bg-[#16A34A]/10 dark:bg-[#4ADE80]/10 mb-5 shadow-md">
            <h3 className="font-bold mb-3 text-[#16A34A] dark:text-[#4ADE80] text-lg flex items-center gap-2">
              <span className="text-xl">💪</span>
              Strengths
            </h3>
            <ul className="flex flex-col gap-3">
              {evalResult.strengths.map((s: any, i: number) => (
                <li
                  key={`${s.element}-${i}`}
                  className="flex flex-col gap-1 bg-white/90 dark:bg-[#232323]/90 rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#16A34A] dark:text-[#4ADE80] text-lg">
                      ★
                    </span>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                      {s.element}
                    </span>
                  </div>
                  <div className="text-neutral-700 dark:text-neutral-200 leading-6">
                    {s.description}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Heuristic: {s.relatedHeuristic}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Weaknesses Section */}
      {Array.isArray(evalResult.weaknesses) &&
        evalResult.weaknesses.length > 0 && (
          <div className="p-5 rounded-2xl bg-[#DC2626]/10 dark:bg-[#F87171]/10 mb-5 shadow-md">
            <h3 className="font-bold mb-3 text-[#DC2626] dark:text-[#F87171] text-lg flex items-center gap-2">
              <span className="text-xl">😕</span>
              Weaknesses
            </h3>
            <ul className="flex flex-col gap-3">
              {evalResult.weaknesses.map((w: any, i: number) => (
                <li
                  key={`${w.element}-${i}`}
                  className="flex flex-col gap-1 bg-white/90 dark:bg-[#232323]/90 rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#DC2626] dark:text-[#F87171] text-lg">
                      •
                    </span>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                      {w.element}
                    </span>
                  </div>
                  <div className="text-neutral-700 dark:text-neutral-200 leading-6">
                    {w.description}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Heuristic: {w.relatedHeuristic}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Weakness Suggestions */}
      {Array.isArray(evalResult.ai?.weakness_suggestions) &&
        evalResult.ai.weakness_suggestions.length > 0 && (
          <div className="p-5 rounded-2xl bg-[#F97316]/10 dark:bg-[#FB923C]/10 mb-5 shadow-md">
            <h3 className="font-bold mb-3 text-[#F97316] dark:text-[#FB923C] text-lg flex items-center gap-2">
              <span className="text-xl">🛠️</span>
              Suggestions
            </h3>
            <ul className="flex flex-col gap-3">
              {evalResult.ai.weakness_suggestions.map((s: any, i: number) => (
                <li
                  key={`${s.element}-${i}`}
                  className="flex flex-col gap-2 bg-white/90 dark:bg-[#232323]/90 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                      {s.element}
                    </span>
                    {/* <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold uppercase bg-[#F97316]/10 dark:bg-[#FB923C]/5 text-[#F97316] dark:text-[#FB923C]">
                      {s.priority}
                    </span> */}
                  </div>
                  <div className="text-neutral-700 dark:text-neutral-200 leading-6">
                    {s.suggestion}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Issues */}
      {Array.isArray(currentFrame?.ai_data?.issues) &&
        currentFrame.ai_data.issues.length > 0 && (
          <div className="p-5 rounded-2xl bg-[#D97706]/10 dark:bg-[#FBBF24]/10 mb-5 shadow-md">
            <h3 className="font-bold mb-3 text-[#D97706] dark:text-[#FBBF24] text-lg flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              Issues & Insights
            </h3>
            <ul className="space-y-4">
              {(evalResult.issues ?? [])
                .sort((a: any, b: any) => {
                  const order: Record<string, number> = {
                    high: 0,
                    medium: 1,
                    low: 2,
                  };
                  const aKey = (a.severity?.toLowerCase() as string) || "low";
                  const bKey = (b.severity?.toLowerCase() as string) || "low";
                  return (order[aKey] ?? 3) - (order[bKey] ?? 3);
                })
                .map((issue: any, i: number) => {
                  // Severity icon and color
                  let icon = "💡",
                    badgeColor =
                      "bg-[#0000FF]/40 dark:bg-[#0000FF]/20 text-[#0000FF]";
                  if (issue.severity?.toLowerCase() === "high") {
                    icon = "🔥";
                    badgeColor =
                      "bg-[#FF0000]/10 dark:bg-[#FF0000]/5 text-[#FF0000]";
                  } else if (issue.severity?.toLowerCase() === "medium") {
                    icon = "⚠️";
                    badgeColor =
                      "bg-[#FFD600]/10 dark:bg-[#FFD600]/5 text-[#FFD600]";
                  }

                  // HOTFIX: Ensure key is always unique
                  return (
                    <li
                      key={`${issue.id ?? "issue"}-${i}`}
                      className="group flex flex-col gap-2 bg-white/90 dark:bg-[#232323]/90 rounded-lg p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Heuristic code pill */}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-mono font-bold border border-[#D97706] dark:border-[#FBBF24] bg-[#D97706]/10 dark:bg-[#FBBF24]/10 text-[#D97706] dark:text-[#FBBF24]`}
                        >
                          {issue.heuristic}
                        </span>
                        {/* Heuristic name */}
                        <span className="font-bold text-[#D97706] dark:text-[#FBBF24] tracking-wide">
                          {HEURISTIC_LABELS[issue.heuristic] || "Unknown"}
                        </span>
                        {/* Severity badge */}
                        <span
                          className={`ml-auto px-5 py-2 rounded-full text-xs font-semibold uppercase ${badgeColor}`}
                        >
                          {issue.severity}
                        </span>
                      </div>
                      {/* Message with accent border */}
                      <div className="text-neutral-800 dark:text-neutral-200 leading-6 mt-3">
                        {issue.message}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

      {/* Suggestions Section */}
      {Array.isArray(currentFrame?.ai_data?.issues) &&
        currentFrame.ai_data.issues.some((issue: any) => issue.suggestion) && (
          <div className="p-5 rounded-2xl bg-[#EA580C]/10 dark:bg-[#FB923C]/10 mb-5 shadow-md">
            <h3 className="font-bold mb-3 text-[#EA580C] darkm:text-[#FB923C] text-lg flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Suggestions
            </h3>
            <ul className="flex flex-col gap-3">
              {(evalResult.issues ?? [])
                .filter((issue: any) => issue.suggestion)
                .map((issue: any, i: number) => (
                  <li
                    key={`${issue.id ?? "suggestion"}-${i}`}
                    className="flex items-start gap-2 bg-white/90 dark:bg-[#232323]/90 rounded-lg p-5 shadow-sm"
                  >
                    <span className="text-[#EA580C] darkm:text-[#FB923C] text-lg mt-1">
                      •
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-200 leading-6">
                      {issue.suggestion}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

      {/* Category Scores */}
      {evalResult.ai?.category_scores && (
        <section className="mb-8 p-5 rounded-2xl bg-[#9333EA]/10 dark:bg-[#C084FC]/10 shadow-md">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#7c3aed] dark:text-[#a78bfa]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              className="opacity-80"
            >
              <circle cx="11" cy="11" r="10" fill="#a78bfa" opacity="0.13" />
              <path
                d="M6 13l3-3 2 2 5-6"
                stroke="#a78bfa"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Category Scores
          </h4>
          <div className="flex flex-col gap-4">
            {Object.entries(evalResult.ai.category_scores).map(
              ([key, value]) => {
                const score =
                  typeof value === "number"
                    ? Math.max(0, Math.min(100, Math.round(value)))
                    : 0;
                const label = key.replace(/_/g, " ");
                // Color ramp for progress bar
                let barColor = "bg-[#f87171]";
                if (score >= 85) barColor = "bg-[#10b981]";
                else if (score >= 65) barColor = "bg-[#a78bfa]";
                else if (score >= 40) barColor = "bg-[#fbbf24]";
                return (
                  <div
                    key={`cat-score-${key}`}
                    className="flex flex-col sm:flex-row items-center gap-3 px-2 py-1 transition-all"
                    role="group"
                    aria-label={`${label} score ${score} out of 100`}
                  >
                    <span className="w-36 text-sm font-medium text-neutral-700 dark:text-neutral-200 capitalize truncate">
                      {label}
                    </span>
                    <div className="flex-1 w-full flex items-center gap-2">
                      <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`${barColor} h-3 rounded-full transition-all`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span
                        className="ml-2 text-xs font-bold tabular-nums"
                        style={{
                          color:
                            score >= 85
                              ? "#10b981"
                              : score >= 65
                              ? "#a78bfa"
                              : score >= 40
                              ? "#fbbf24"
                              : "#f87171",
                        }}
                      >
                        {score}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      {evalResult.ai?.category_score_justifications && (
        <div className="p-5 rounded-2xl bg-[#9333EA]/10 dark:bg-[#C084FC]/10 mb-6 shadow-md">
          <h4 className="font-bold mb-3 text-[#9333EA] dark:text-[#C084FC] text-lg flex items-center gap-2">
            <span className="text-xl">📝</span>
            Category Score Justifications
          </h4>
          <ul className="flex flex-col gap-3">
            {Object.entries(evalResult.ai.category_score_justifications).map(
              ([category, justification], i) => (
                <li
                  key={`${category}-justification-${i}`}
                  className="flex items-start gap-2 bg-white/90 dark:bg-[#232323]/90 rounded-lg p-3 shadow-sm"
                >
                  <span className="font-bold capitalize text-[#9333EA] dark:text-[#C084FC] min-w-[120px]">
                    {category.replace(/_/g, " ")}:
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-200 leading-6">
                    {justification}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Heuristic breakdown */}
      {Array.isArray(evalResult.ai?.heuristic_breakdown) &&
        evalResult.ai.heuristic_breakdown.length > 0 && (
          <section className="mb-8 p-5 rounded-2xl bg-[#0ea5e9]/10 dark:bg-[#38bdf8]/10 shadow-md">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#0891b2] dark:text-[#38bdf8]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className="opacity-80"
              >
                <path
                  d="M3 12h18"
                  stroke="#0891b2"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M6 7h.01M6 17h.01"
                  stroke="#0891b2"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              Heuristic Breakdown
              <Popover
                open={isHoveringOverScoringLegendPopover}
                onOpenChange={setIsHoveringOverScoringLegendPopover}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Show scoring legend"
                    className="ml-1 inline-flex items-center justify-center rounded-full p-1 text-[#0891b2] hover:bg-[#0ea5e9]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0891b2] transition"
                    onMouseEnter={() =>
                      setIsHoveringOverScoringLegendPopover(true)
                    }
                    onMouseLeave={() =>
                      setIsHoveringOverScoringLegendPopover(false)
                    }
                  >
                    <Info size={16} />
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="end"
                  side="top"
                  className="w-[360px] p-4"
                  onMouseEnter={() =>
                    setIsHoveringOverScoringLegendPopover(true)
                  }
                  onMouseLeave={() =>
                    setIsHoveringOverScoringLegendPopover(false)
                  }
                >
                  <div className="rounded-lg border-2 border-[#ED5E20]/40 bg-white/90 dark:bg-[#232323]/90 p-4">
                    <h5 className="text-sm font-bold text-[#ED5E20] mb-3">
                      Scoring Legend
                    </h5>
                    <div className="grid gap-3 grid-cols-2 text-sm">
                      {/* 0 */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 font-semibold">
                          0
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 text-xs">
                          Missing
                        </span>
                      </div>
                      {/* 1 */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-semibold">
                          1
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 text-xs">
                          Poor
                        </span>
                      </div>
                      {/* 2 */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-semibold">
                          2
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 text-xs">
                          Adequate
                        </span>
                      </div>
                      {/* 3 */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                          3
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 text-xs">
                          Good
                        </span>
                      </div>
                      {/* 4 */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold">
                          4
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 text-xs">
                          Excellent
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Scores show how well each heuristic is satisfied. Compare
                      the value to the maximum (4) to see which principles need
                      improvement and which are fully met.
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </h4>

            {/* Inline legend (0–4) for quick reference */}
            <div className="mb-4 rounded-lg border border-[#0891b2]/25 bg-white/80 dark:bg-[#0f172a]/40 p-3">
              <div
                className="grid grid-cols-5 gap-3 text-xs"
                aria-label="Heuristic score legend from 0 (Missing) to 4 (Excellent)"
                role="list"
              >
                <div
                  className="flex flex-col items-center gap-1"
                  role="listitem"
                >
                  <span className="px-2 py-0.5 w-8 text-center rounded-md bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 font-semibold tabular-nums">
                    0
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">
                    Missing
                  </span>
                </div>
                <div
                  className="flex flex-col items-center gap-1"
                  role="listitem"
                >
                  <span className="px-2 py-0.5 w-8 text-center rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-semibold tabular-nums">
                    1
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">Poor</span>
                </div>
                <div
                  className="flex flex-col items-center gap-1"
                  role="listitem"
                >
                  <span className="px-2 py-0.5 w-8 text-center rounded-md bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-semibold tabular-nums">
                    2
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">
                    Adequate
                  </span>
                </div>
                <div
                  className="flex flex-col items-center gap-1"
                  role="listitem"
                >
                  <span className="px-2 py-0.5 w-8 text-center rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold tabular-nums">
                    3
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">Good</span>
                </div>
                <div
                  className="flex flex-col items-center gap-1"
                  role="listitem"
                >
                  <span className="px-2 py-0.5 w-8 text-center rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold tabular-nums">
                    4
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">
                    Excellent
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop / tablet: table */}
            <div className="hidden sm:block">
              <div className="overflow-auto rounded-xl border border-[#0891b2]/20 shadow-sm max-h-[60vh]">
                <Table className="w-full text-xs table-fixed">
                  <TableHeader className="bg-[#0ea5e9]/10 dark:bg-[#38bdf8]/10 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="px-2 py-1.5 w-20 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wide whitespace-nowrap">
                        Code
                      </TableHead>
                      <TableHead className="px-2 py-1.5 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wide">
                        Principle
                      </TableHead>
                      <TableHead className="px-2 py-1.5 w-44 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wide whitespace-nowrap">
                        Evaluation focus
                      </TableHead>
                      {/* <TableHead className="px-2 py-1.5 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wide">
                                  Justification
                                </TableHead> */}
                      <TableHead className="px-2 py-1.5 w-24 text-right text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wide">
                        Score
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="bg-white/90 dark:bg-[#232323]/90">
                    {evalResult.ai.heuristic_breakdown.map(
                      (h: any, idx: number) => {
                        const score = typeof h.score === "number" ? h.score : 0;
                        const max =
                          typeof h.max_points === "number" ? h.max_points : 4;
                        const pct = Math.round(
                          (score / Math.max(1, max)) * 100
                        );
                        const badgeClass =
                          pct >= 85
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                            : pct >= 65
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                            : pct >= 40
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";

                        return (
                          <TableRow
                            key={`heuristic-${h.code}-${idx}`}
                            className="align-top"
                          >
                            <TableCell className="px-2 py-2 align-top whitespace-nowrap">
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-mono font-bold border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-slate-200">
                                {h.code}
                              </span>
                            </TableCell>

                            {/* Allow long principle to wrap without pushing score out of view */}
                            <TableCell className="px-2 py-2 align-top min-w-[12rem] break-words whitespace-normal leading-5">
                              <div className="font-semibold text-neutral-800 dark:text-neutral-100">
                                {h.principle}
                              </div>
                            </TableCell>

                            {/* Wrap evaluation focus too */}
                            <TableCell className="px-2 py-2 align-top text-[11px] text-neutral-500 dark:text-neutral-400 min-w-[10rem] break-words whitespace-normal leading-5">
                              {h.evaluation_focus}
                            </TableCell>

                            {/* <TableCell className="px-2 py-2 align-top text-[11px] text-neutral-600 dark:text-neutral-400">
                                      {h.justification}
                                    </TableCell> */}

                            <TableCell className="px-2 py-2 align-top text-right">
                              <div
                                className="flex flex-col items-end gap-1"
                                aria-label={`Score ${score} out of ${max}, ${pct} percent`}
                              >
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${badgeClass} border border-transparent shadow-sm`}
                                  role="status"
                                >
                                  <span className="tabular-nums">{score}</span>
                                  <span className="text-xs font-normal text-neutral-600 dark:text-neutral-400">
                                    / {max}
                                  </span>
                                </span>
                                <span
                                  className={`mr-2 text-[11px] font-semibold tabular-nums ${
                                    pct >= 85
                                      ? "text-green-600 dark:text-green-300"
                                      : pct >= 65
                                      ? "text-blue-700 dark:text-blue-300"
                                      : pct >= 40
                                      ? "text-amber-600 dark:text-amber-300"
                                      : "text-red-600 dark:text-red-300"
                                  }`}
                                  title={`${pct}%`}
                                  aria-hidden={false}
                                  aria-label={`${pct} percent`}
                                >
                                  {pct}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile: stacked cards */}
            <div className="sm:hidden grid gap-3">
              {evalResult.ai.heuristic_breakdown.map((h: any, idx: number) => {
                const score = typeof h.score === "number" ? h.score : 0;
                const max = typeof h.max_points === "number" ? h.max_points : 4;
                const pct = Math.round((score / Math.max(1, max)) * 100);
                const badgeClass =
                  pct >= 85
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                    : pct >= 65
                    ? "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200"
                    : pct >= 40
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";

                return (
                  <div
                    key={`heuristic-mobile-${h.code}-${idx}`}
                    className="bg-white/90 dark:bg-[#232323]/90 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-full text-xs font-mono font-bold border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-slate-200">
                          {h.code}
                        </span>
                        <div>
                          <div className="font-semibold text-neutral-800 dark:text-neutral-100">
                            {h.principle}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {h.evaluation_focus}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold ${badgeClass}`}
                      >
                        <span className="tabular-nums">
                          {score} / {max}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          ({pct}%)
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {h.justification}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      {/* Recommendation Resources */}
      {evalResult.ai?.resources && evalResult.ai.resources.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0D9488]/10 dark:bg-[#2DD4BF]/10 mb-6 shadow-md">
          <h3 className="font-bold mb-4 text-[#0D9488] dark:text-[#2DD4BF] text-lg flex items-center gap-2">
            <span className="text-2xl">💾</span>
            Recommended Resources
          </h3>
          <ul className="flex flex-col gap-4">
            {evalResult.ai.resources.map((resource: any, i: number) => {
              // Find the related issue for context
              const issue = (evalResult.ai?.issues ?? []).find(
                (iss: any) => iss.id === resource.issue_id
              );
              return (
                <li
                  key={`${resource.issue_id ?? "resource"}-${i}`}
                  className="bg-white/90 dark:bg-[#232323]/90 rounded-lg px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-5 flex-wrap">
                    <span className="font-bold text-[#0D9488] dark:text-[#2DD4BF] tracking-wide">
                      {resource.title}
                    </span>
                    {/* {resource.issue_id && (
                      <span className="ml-auto px-5 py-2 rounded-full text-xs font-semibold uppercase bg-[#0D9488]/10 dark:bg-[#2DD4BF]/5 text-[#0D9488] dark:text-[#2DD4BF]">
                        Issue: {resource.issue_id}
                      </span>
                    )} */}
                  </div>
                  {issue && (
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                      Related Issue: {issue.message}
                    </div>
                  )}
                  <div className="text-neutral-700 dark:text-neutral-200 mt-3 leading-6 mb-1">
                    {resource.description}
                  </div>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0D9488] dark:text-[#2DD4BF] underline mt-3"
                  >
                    {resource.url}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};

export default EvaluationResult;
