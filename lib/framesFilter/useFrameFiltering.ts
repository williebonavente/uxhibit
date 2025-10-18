import React from "react";
import type { FrameEvaluation } from "@/lib/types/evalResponse";
import type { EvalResponse } from "@/lib/types/evalResponse";

/**
 * Hook that computes sorted/filtered frame lists and keeps selected index / eval result in sync.
 * Keep pure mapping function injected to avoid coupling to mapper implementation.
 */
export default function useFrameFiltering(options: {
  frameEvaluations: FrameEvaluation[];
  sortOrder: "default" | "asc" | "desc";
  searchQuery: string;
  selectedFrameIndex: number;
  setSelectedFrameIndex: (i: number) => void;
  setEvalResult: (r: EvalResponse | null) => void;
  mapFrameToEvalResponse: (frame: FrameEvaluation, idx: number) => EvalResponse;
}) {
  const {
    frameEvaluations,
    sortOrder,
    searchQuery,
    selectedFrameIndex,
    setSelectedFrameIndex,
    setEvalResult,
    mapFrameToEvalResponse,
  } = options;

  const sortedFrameEvaluations = React.useMemo(() => {
    if (!frameEvaluations || frameEvaluations.length === 0) return frameEvaluations;
    if (sortOrder === "default") return frameEvaluations;
    const [overall, ...frames] = frameEvaluations;
    const sorted = [...frames].sort((a, b) => {
      const aScore = a?.ai_data?.overall_score ?? 0;
      const bScore = b?.ai_data?.overall_score ?? 0;
      return sortOrder === "asc" ? aScore - bScore : bScore - aScore;
    });
    return overall ? [overall, ...sorted] : sorted;
  }, [frameEvaluations, sortOrder]);

  const filteredFrameEvaluations = React.useMemo(() => {
    if (!searchQuery?.trim()) return sortedFrameEvaluations;
    const q = searchQuery.toLowerCase();
    return (sortedFrameEvaluations || []).filter((frame) =>
      (frame?.ai_summary ?? "").toLowerCase().includes(q) ||
      (frame?.ai_data?.summary ?? "").toLowerCase().includes(q) ||
      (frame?.node_id ?? "").toLowerCase().includes(q)
    );
  }, [sortedFrameEvaluations, searchQuery]);

  const currentFrame = React.useMemo(() => {
    // prefer the currently selected index within the sorted list
    return (sortedFrameEvaluations && sortedFrameEvaluations[selectedFrameIndex]) ?? sortedFrameEvaluations?.[0] ?? null;
  }, [sortedFrameEvaluations, selectedFrameIndex]);

  // keep evalResult in sync with currentFrame + selectedFrameIndex
  React.useEffect(() => {
    if (currentFrame) {
      setEvalResult(mapFrameToEvalResponse(currentFrame, selectedFrameIndex));
    } else {
      setEvalResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFrame, selectedFrameIndex]);

  // adjust selectedFrameIndex when search changes (mirror original behavior)
  React.useEffect(() => {
    if (!searchQuery?.trim()) {
      setSelectedFrameIndex(0);
      return;
    }

    const num = parseInt(searchQuery.trim(), 10);
    if (!Number.isNaN(num) && num > 0 && num < (sortedFrameEvaluations?.length ?? 0)) {
      setSelectedFrameIndex(num);
      return;
    }

    const idx = (sortedFrameEvaluations || []).findIndex(
      (frame, i) =>
        i > 0 &&
        (
          (frame?.ai_summary ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (frame?.ai_data?.summary ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (frame?.node_id ?? "").toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    setSelectedFrameIndex(idx === -1 ? 0 : idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortedFrameEvaluations]);

  return { sortedFrameEvaluations, filteredFrameEvaluations, currentFrame };
}