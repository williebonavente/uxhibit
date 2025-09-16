import React from "react";

interface EvaluationResultProps {
  evalResult: any;
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

  return (
    <>
      {/* Score */}
      {typeof evalResult.overall_score === "number" && (
        <div className="p-3 rounded-lg bg-[#ED5E20]/10 justify-center items-center">
          <h3 className="font-medium mb-2 text-center">
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
          <div className="text-2xl font-bold text-[#ED5E20] text-center">
            {Math.round(evalResult.overall_score)}/100
          </div>
        </div>
      )}
      {/* Summary */}
      <div className="p-3 rounded-lg bg-[#FFFF00]/10">
        <h3 className="font-medium mb-2">Summary</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {evalResult.summary}
        </p>
      </div>
      {/* Strengths */}
      {evalResult.strengths && evalResult.strengths.length > 0 && (
        <div className="p-3 rounded-lg bg-[#008000]/10">
          <h3 className="font-medium mb-2">Strengths</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {evalResult.strengths.map((s: string, i: number) => (
              <li key={i} className="text-neutral-600 dark:text-neutral-300">{s}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Issues */}
      {currentFrame?.ai_data.issues?.length > 0 && (
        <div className="p-3 rounded-lg bg-[#FFB300]/10 mb-4">
          <h3 className="font-medium mb-2">Issues</h3>
          <ul className="space-y-3">
            {(evalResult.issues ?? [])
              .sort((a: any, b: any) => {
                const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
                const aKey = (a.severity?.toLowerCase() as string) || "low";
                const bKey = (b.severity?.toLowerCase() as string) || "low";
                return (order[aKey] ?? 3) - (order[bKey] ?? 3);
              })
              .map((issue: any, i: number) => {
                let badgeColor = "bg-gray-300 text-gray-800";
                if (issue.severity?.toLowerCase() === "high") badgeColor = "bg-red-500 text-white";
                else if (issue.severity?.toLowerCase() === "medium") badgeColor = "bg-yellow-400 text-yellow-900";
                else if (issue.severity?.toLowerCase() === "low") badgeColor = "bg-blue-200 text-blue-900";

                return (
                  <li
                    key={issue.id || i}
                    className="flex items-start gap-3 bg-white/70 dark:bg-[#232323]/70 rounded-lg p-3 border border-[#ED5E20]/20 shadow-sm"
                  >
                    <span
                      className={`min-w-[60px] text-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeColor}`}
                      style={{ letterSpacing: "0.05em" }}
                    >
                      {issue.severity}
                    </span>
                    <span className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">
                      {issue.message}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
      {/* Suggestions Section */}
      {currentFrame?.ai_data.issues?.some((issue: any) => issue.suggestion) && (
        <div className="p-3 rounded-lg bg-[#ED5E20]/10 mb-4">
          <h3 className="font-medium mb-2">Suggestions</h3>
          <ul className="list-disc list-inside text-sm space-y-2">
            {(evalResult.issues ?? [])
              .filter((issue: any) => issue.suggestion)
              .map((issue: any, i: number) => (
                <li key={issue.id || i} className="text-neutral-700 dark:text-neutral-200">
                  {issue.suggestion}
                </li>
              ))}
          </ul>
        </div>
      )}
      {/* Weaknesses */}
      {currentFrame?.ai_data.weaknesses?.length > 0 && (
        <div className="p-3 rounded-lg bg-[#FF0000]/10">
          <h3 className="font-medium mb-2">Weaknesses</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {(evalResult.weaknesses ?? []).map((w: string, i: number) => (
              <li key={i} className="text-neutral-600 dark:text-neutral-300">{w}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Category Scores */}
      {currentFrame?.ai_data.category_scores && (
        <div className="p-3 rounded-lg bg-[#ED5E20]/10">
          <h3 className="font-medium mb-2">Category Scores</h3>
          <ul className="space-y-2 list-disc list-inside">
            {Object.entries(evalResult.category_scores ?? {}).map(([category, score]: [string, any]) => {
              // Coloring logic
              let bg =
                "bg-gray-100 dark:bg-gray-800 text-neutral-600 dark:text-neutral-300";
              if (score >= 75) {
                bg =
                  "bg-[#008000]/20 dark:bg-[#008000]/10 text-neutral-600 dark:text-neutral-300";
              } else if (score < 50) {
                bg =
                  "bg-[#FF0000]/20 dark:bg-[#FF0000]/10 text-neutral-600 dark:text-neutral-300";
              } else {
                bg =
                  "bg-[#FFFF00]/20 dark:bg-[#FFFF00]/10 text-neutral-600 dark:text-neutral-300";
              }
              return (
                <li
                  key={category}
                  className={`rounded-md px-3 py-2 flex justify-between items-center font-medium ${bg}`}
                >
                  <span className="capitalize">
                    {category.replace(/_/g, " ")}
                  </span>
                  <span>{Math.round(score)}</span>
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