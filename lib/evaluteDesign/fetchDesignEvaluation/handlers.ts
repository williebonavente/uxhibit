import { fetchEvaluationsForDesign } from "@/lib/evaluteDesign/fetchDesignEvaluation/fechDesignEvaluation";
import type { Dispatch, SetStateAction } from "react";
import type { FrameEvaluation } from "@/lib/types/evalResponse";

/**
 * Returns a bound fetchEvaluations function that will fetch combined evaluations
 * and update the provided state setter.
 */
export function createFetchEvaluationsHandler(options: {
  getDesignId: () => string | undefined | null;
  setFrameEvaluations: Dispatch<SetStateAction<FrameEvaluation[]>>;
}) {
  const { getDesignId, setFrameEvaluations } = options;

  return async function fetchEvaluations() {
    const designId = getDesignId();
    if (!designId) {
      console.log("[fetchEvaluations] No design id, skipping.");
      setFrameEvaluations([]);
      return;
    }
    console.log("[fetchEvaluations] Fetching latest version for design:", designId);
    const combined = await fetchEvaluationsForDesign(designId);
    setFrameEvaluations(combined);
    console.log("[fetchEvaluations] Combined frame evaluations set:", combined);
  };
}