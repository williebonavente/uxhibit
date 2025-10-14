import { createClient } from "@/utils/supabase/client";
import { EvaluateInput, EvalResponse, evaluateDesign, Design } from "@/app/designs/[id]/page";
import { Dispatch, SetStateAction } from "react";

let pollInterval: NodeJS.Timeout | null = null;

export async function handleEvaluateWithParams(
  params: EvaluateInput,
  design: any,
  setLoadingEval: Dispatch<SetStateAction<boolean>>,
  setEvalError: Dispatch<SetStateAction<string | null>>,
  setEvalResult: Dispatch<SetStateAction<EvalResponse | null>>,
  setFrameEvaluations: Dispatch<SetStateAction<any[]>>,
  setExpectedFrameCount: Dispatch<SetStateAction<number>>,
  setEvaluatedFramesCount: Dispatch<SetStateAction<number>>,
  fetchEvaluations: () => Promise<void>
) {
  console.log("[handleEvaluateWithParams] START");
  setLoadingEval(true);
  setEvalError(null);
  setEvalResult(null);
  setFrameEvaluations([]);
  setExpectedFrameCount(params.frameIds ? params.frameIds.length : 0);
  setEvaluatedFramesCount(0);

  // Clear any previous interval (use global pollInterval)
  if (pollInterval) {
    console.log("[handleEvaluateWithParams] Clearing previous pollInterval");
    clearInterval(pollInterval);
  }

  let isPolling = false;
  pollInterval = setInterval(async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      const supabase = createClient();

      const currentVersionId = params.versionId; // Use the new versionId from backend
      console.log("[Polling] Using currentVersionId:", currentVersionId);

      const { data: frameData, error: pollError } = await supabase
        .from("design_frame_evaluations")
        .select("id")
        .eq("design_id", params.designId)
        .eq("version_id", currentVersionId);

      if (pollError) {
        console.error("[Polling] Supabase error:", JSON.stringify(pollError, null));
      }
      console.log("[Polling] frameData:", frameData);

      const count = (frameData || []).filter(f => f.id !== "overallFrame").length;
      setEvaluatedFramesCount(count);
      console.log(`[Polling] Evaluated frames: ${count} / ${params.frameIds ? params.frameIds.length : 0}`);
      if (count >= (params.frameIds ? params.frameIds.length : 0)) {
        console.log("[Polling] All frames evaluated. Stopping poll and fetching evaluations.");
        if (pollInterval) clearInterval(pollInterval);
        setTimeout(async () => {
          setLoadingEval(false);
          await fetchEvaluations();
        }, 2000); 
      }
    } catch (err) {
      console.error("[Polling] Error during polling:", err);
    } finally {
      isPolling = false;
    }
  }, 1000);

  try {
    console.log("[handleEvaluateWithParams] Calling evaluateDesign with params:", params);
    const evalResult = await evaluateDesign(params);
    console.log("[handleEvaluateWithParams] evaluateDesign result:", evalResult);
  } catch (e: any) {
    console.error("[handleEvaluateWithParams] Evaluation error:", e);
    setEvalError(e.message || "Failed to evaluate");
    if (pollInterval) clearInterval(pollInterval);
    setLoadingEval(false);
  }
}
export async function handleEvalParamsSubmit(
  params: any,
  handleEvaluateWithParams: (...args: any[]) => Promise<void>,
  design: Design,
  setLoadingEval: React.Dispatch<React.SetStateAction<boolean>>,
  setEvalError: React.Dispatch<React.SetStateAction<string | null>>,
  setEvalResult: React.Dispatch<React.SetStateAction<EvalResponse | null>>,
  setFrameEvaluations: React.Dispatch<React.SetStateAction<any[]>>,
  setExpectedFrameCount: React.Dispatch<React.SetStateAction<number>>,
  setEvaluatedFramesCount: React.Dispatch<React.SetStateAction<number>>,
  fetchEvaluations: () => Promise<void>,
  setShowEvalParams: React.Dispatch<React.SetStateAction<boolean>>,
  currentUserId: string,
) {
  console.log("[handleEvalParamsSubmit] Closing modal and starting evaluation");
  setShowEvalParams(false);

  const latestSnapshot = {
    age: params.generation,
    occupation: params.occupation,
  };

  console.log("[handleEvalParamsSubmit] Params for evaluation:", { ...params, snapshot: latestSnapshot });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const response = await fetch(`${baseUrl}/api/start-evaluation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      design_id: design.id,
      created_by: currentUserId,
    }),
  });

  const result = await response.json();
  const versionId = result.versionId; // This is the new version's id


  await handleEvaluateWithParams(
    {
      ...params,
      versionId,
      snapshot: latestSnapshot,
    },
    design,
    setLoadingEval,
    setEvalError,
    setEvalResult,
    setFrameEvaluations,
    setExpectedFrameCount,
    setEvaluatedFramesCount,
    fetchEvaluations
  );
}


