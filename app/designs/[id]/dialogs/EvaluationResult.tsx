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
        : evalResult.overall_score) === "number" &&
        (() => {
          const score = Math.round(
            selectedFrameIndex === 0
              ? currentFrame?.total_score
              : evalResult.overall_score
          );
          const percent = Math.max(0, Math.min(score, 100));
          const radius = 60; 
          const stroke = 10;
          const normalizedRadius = radius - stroke / 2;
          const circumference = normalizedRadius * 2 * Math.PI;
          const strokeDashoffset =
            circumference - (percent / 100) * circumference;

          let color = "#ED5E20";
          if (score >= 75) color = "#16A34A";
          else if (score < 50) color = "#DC2626";

          return (
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
                {selectedFrameIndex === 0
                  ? "Overall Score"
                  : frameEvaluations[selectedFrameIndex]?.ai_summary ||
                    frameEvaluations[selectedFrameIndex]?.node_id
                    ? `Frame ${selectedFrameIndex} Score`
                    : "Frame Score"}
              </h3>
              <span className="text-md text-neutral-500">out of 100</span>
            </div>
          );
        })()}

      {/* Summary */}
      <div className="p-5 rounded-2xl bg-[#2563EB]/10 dark:bg-[#60A5FA]/10 b-5 shadow-md flex items-start gap-5">
        <div className="flex-1">
          <h3 className="font-bold mb-3 text-[#2563EB] dark:text-[#60A5FA] text-lg flex items-center gap-2">
            <span className="text-xl">💡</span>
            Summary
          </h3>
          <p className="text-neutral-900 dark:text-neutral-100 leading-8">
            {evalResult.summary}
          </p>
        </div>
      </div>
      {/* Strengths */}
      {Array.isArray(evalResult.strengths) && evalResult.strengths.length > 0 && (
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
                  <span className="text-[#16A34A] dark:text-[#4ADE80] text-lg">★</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-200">{s.element}</span>
              
                </div>
                <div className="text-neutral-700 dark:text-neutral-200 leading-6">{s.description}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Heuristic: {s.relatedHeuristic}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses Section */}
      {Array.isArray(evalResult.weaknesses) && evalResult.weaknesses.length > 0 && (
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
                  <span className="text-[#DC2626] dark:text-[#F87171] text-lg">•</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-200">{w.element}</span>
                
                </div>
                <div className="text-neutral-700 dark:text-neutral-200 leading-6">{w.description}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Heuristic: {w.relatedHeuristic}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Issues */}
      {Array.isArray(currentFrame?.ai_data?.issues) && currentFrame.ai_data.issues.length > 0 && (
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
                    key={`${issue.id ?? 'issue'}-${i}`}
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
      {Array.isArray(currentFrame?.ai_data?.issues) && currentFrame.ai_data.issues.some((issue: any) => issue.suggestion) && (
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
                  key={`${issue.id ?? 'suggestion'}-${i}`}
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
                  key={`${resource.issue_id ?? 'resource'}-${i}`}
                  className="bg-white/90 dark:bg-[#232323]/90 rounded-lg px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-5 flex-wrap">
                    <span className="font-bold text-[#0D9488] dark:text-[#2DD4BF] tracking-wide">
                      {resource.title}
                    </span>
                    {resource.issue_id && (
                      <span className="ml-auto px-5 py-2 rounded-full text-xs font-semibold uppercase bg-[#0D9488]/10 dark:bg-[#2DD4BF]/5 text-[#0D9488] dark:text-[#2DD4BF]">
                        Issue: {resource.issue_id}
                      </span>
                    )}
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
