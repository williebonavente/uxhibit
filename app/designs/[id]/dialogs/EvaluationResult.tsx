import React from "react";
import { EvalResponse } from "../page";

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
  return (
    <>
      {/* Score */}
      {typeof (selectedFrameIndex === 0
        ? currentFrame?.total_score
        : evalResult.overall_score) === "number" && (() => {
          const score = Math.round(
            selectedFrameIndex === 0
              ? currentFrame?.total_score
              : evalResult.overall_score
          );
          const percent = Math.max(0, Math.min(score, 100));
          const radius = 36;
          const stroke = 8;
          const normalizedRadius = radius - stroke / 2;
          const circumference = normalizedRadius * 2 * Math.PI;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          let color = "#ED5E20";
          if (score >= 75) color = "#008000";
          else if (score < 50) color = "#FF0000";

          return (
            <div className="flex flex-col items-center justify-center p-5 mb-6">
              <div className="relative w-20 h-20 mb-2">
                <svg height="80" width="80">
                  <circle
                    stroke="#e5e7eb"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx="40"
                    cy="40"
                  />
                  <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference + " " + circumference}
                    style={{ strokeDashoffset, transition: "stroke-dashoffset 0.6s ease, stroke 0.3s" }}
                    r={normalizedRadius}
                    cx="40"
                    cy="40"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold" style={{ color }}>
                  {score}
                </span>
              </div>
              <h3 className="font-bold text-center text-base" style={{ color }}>
                {selectedFrameIndex === 0
                  ? "Overall Score"
                  : (
                    frameEvaluations[selectedFrameIndex]?.ai_summary ||
                      frameEvaluations[selectedFrameIndex]?.node_id
                      ? `Frame ${selectedFrameIndex} Score`
                      : "Frame Score"
                  )
                }
              </h3>
              <span className="text-xs text-neutral-500 mt-1">out of 100</span>
            </div>
          );
        })()}
      {/* Summary */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#18181b] mb-6 shadow-xl border-l-8 border-[#FFD600] flex items-start gap-5">
        <span className="text-3xl mt-1 select-none" style={{ color: "#FFD600" }}>📝</span>
        <div className="flex-1">
          <h3 className="font-extrabold mb-2 text-[#FFD600] text-xl flex items-center gap-2 tracking-wider">
            Summary
          </h3>
          <p className="text-base md:text-lg text-neutral-900 dark:text-neutral-100 leading-relaxed font-medium">
            {evalResult.summary}
          </p>
        </div>
      </div>
      {/* Strengths */}
      {evalResult.strengths && evalResult.strengths.length > 0 && (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#B2FFB2] via-[#E0FFE0] to-[#F8FFF1] mb-4 shadow border-l-8 border-[#008000]/80">
          <h3 className="font-bold mb-3 text-[#008000] text-lg flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Strengths
          </h3>
          <ul className="flex flex-col gap-3">
            {evalResult.strengths.map((s: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-3 bg-white/90 dark:bg-[#232323]/90 rounded-lg p-3 border-l-4 border-[#008000] shadow-sm"
              >
                <span className="text-[#008000] text-lg mt-1">★</span>
                <span className="text-neutral-700 dark:text-neutral-200 text-sm font-medium">
                  {s}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Issues */}
      {currentFrame?.ai_data.issues?.length > 0 && (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FFF3E0] via-[#FFF8E1] to-[#FFECB3] mb-6 shadow-lg border border-[#ED5E20]/20">
          <h3 className="font-bold mb-4 text-[#ED5E20] text-lg tracking-wide flex items-center gap-2">
            <span className="inline-block w-2 h-6 bg-[#ED5E20] rounded-r-lg mr-2" />
            Issues & Insights
          </h3>
          <ul className="space-y-4">
            {(evalResult.issues ?? [])
              .sort((a: any, b: any) => {
                const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
                const aKey = (a.severity?.toLowerCase() as string) || "low";
                const bKey = (b.severity?.toLowerCase() as string) || "low";
                return (order[aKey] ?? 3) - (order[bKey] ?? 3);
              })
              .map((issue: any, i: number) => {
                // Severity icon and color
                let icon = "💡", badgeColor = "bg-blue-100 text-blue-800";
                if (issue.severity?.toLowerCase() === "high") {
                  icon = "🔥";
                  badgeColor = "bg-red-100 text-red-700";
                } else if (issue.severity?.toLowerCase() === "medium") {
                  icon = "⚠️";
                  badgeColor = "bg-yellow-100 text-yellow-800";
                }

                return (
                  <li
                    key={issue.id || i}
                    className="group flex flex-col gap-2 bg-white/90 dark:bg-[#232323]/90 rounded-xl p-4 border-l-4 border-[#ED5E20] shadow transition-all hover:shadow-xl hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Severity icon */}
                      <span className="text-xl" title={issue.severity}>
                        {icon}
                      </span>
                      {/* Heuristic code pill */}
                      <span className={`px-2 py-1 rounded-full text-xs font-mono font-bold border border-[#ED5E20] bg-[#ED5E20]/10 text-[#ED5E20]`}>
                        {issue.heuristic}
                      </span>
                      {/* Heuristic name */}
                      <span className="text-sm font-bold text-[#ED5E20] tracking-wide">
                        {HEURISTIC_LABELS[issue.heuristic] || "Unknown"}
                      </span>
                      {/* Severity badge */}
                      <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold uppercase ${badgeColor}`}>
                        {issue.severity}
                      </span>
                    </div>
                    {/* Message with accent border */}
                    <div className="pl-3 border-l-4 border-[#ED5E20] text-neutral-800 dark:text-neutral-200 text-sm font-medium">
                      {issue.message}
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
      {/* Suggestions Section */}
      {currentFrame?.ai_data.issues?.some((issue: any) => issue.suggestion) && (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FFE0B2] via-[#FFF3E0] to-[#FFF8E1] mb-4 shadow border-l-8 border-[#ED5E20]/80">
          <h3 className="font-bold mb-3 text-[#ED5E20] text-lg flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Suggestions
          </h3>
          <ul className="flex flex-col gap-3">
            {(evalResult.issues ?? [])
              .filter((issue: any) => issue.suggestion)
              .map((issue: any, i: number) => (
                <li
                  key={issue.id || i}
                  className="flex items-start gap-3 bg-white/90 dark:bg-[#232323]/90 rounded-lg p-3 border-l-4 border-[#ED5E20] shadow-sm"
                >
                  <span className="text-[#ED5E20] text-lg mt-1">•</span>
                  <span className="text-neutral-700 dark:text-neutral-200 text-sm font-medium">
                    {issue.suggestion}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Weaknesses Section */}
      {currentFrame?.ai_data.weaknesses?.length > 0 && (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FFCDD2] via-[#FFEBEE] to-[#FFF8E1] mb-4 shadow border-l-8 border-[#FF0000]/80">
          <h3 className="font-bold mb-3 text-[#FF0000] text-lg flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Weaknesses
          </h3>
          <ul className="flex flex-col gap-3">
            {(evalResult.weaknesses ?? []).map((w: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-3 bg-white/90 dark:bg-[#232323]/90 rounded-lg p-3 border-l-4 border-[#FF0000] shadow-sm"
              >
                <span className="text-[#FF0000] text-lg mt-1">•</span>
                <span className="text-neutral-600 dark:text-neutral-300 text-sm font-medium">
                  {w}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Category Scores */}
      {currentFrame?.ai_data.category_scores && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181b] mb-4 shadow-lg border-l-8 border-[#ED5E20]/80">
          <h3 className="font-bold mb-4 text-[#ED5E20] text-lg flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Category Scores
          </h3>
          <ul className="flex flex-col gap-3">
            {Object.entries(evalResult.category_scores ?? {}).map(([category, score]: [string, any]) => {
              let accent = "border-l-4 border-gray-300";
              let icon = "🟡";
              if (score >= 75) {
                accent = "border-l-4 border-[#008000]";
                icon = "🟢";
              } else if (score < 50) {
                accent = "border-l-4 border-[#FF0000]";
                icon = "🔴";
              }
              return (
                <li
                  key={category}
                  className={`flex items-center gap-3 bg-gray-50 dark:bg-[#232323] rounded-lg px-4 py-3 shadow-sm ${accent}`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="capitalize flex-1 font-semibold text-neutral-800 dark:text-neutral-200">
                    {category.replace(/_/g, " ")}
                  </span>
                  <span className="text-base font-bold text-neutral-700 dark:text-neutral-100">
                    {Math.round(score)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Recommendation Resources */}
    {/* Recommendation Resources */}
  {evalResult.ai?.resources && evalResult.ai.resources.length > 0 && (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#18181b] mb-4 shadow-lg border-l-8 border-blue-400/80">
      <h3 className="font-bold mb-4 text-blue-600 dark:text-blue-300 text-lg flex items-center gap-2">
        <span className="text-2xl">📚</span>
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
              key={resource.issue_id || i}
              className="bg-blue-50 dark:bg-[#232345] rounded-lg px-4 py-3 shadow-sm border-l-4 border-blue-400"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-blue-700 dark:text-blue-200">{resource.title}</span>
                {resource.issue_id && (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs bg-blue-200 text-blue-800 font-mono">
                    Issue: {resource.issue_id}
                  </span>
                )}
              </div>
              {issue && (
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Related Issue: {issue.message}
                </div>
              )}
              <div className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">
                {resource.description}
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-300 underline"
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