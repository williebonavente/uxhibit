import { createClient } from "@/utils/supabase/client";
import { EvaluateInput, EvalResponse, evaluateDesign, Design } from "@/app/designs/[id]/page";
import { Dispatch, SetStateAction } from "react";

let pollInterval: NodeJS.Timeout | null = null;

export async function handleEvaluateWithParams(
  params: EvaluateInput,
  design: Design,
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

      const currentVersionId = params.versionId;
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

      const count = Array.isArray(frameData)
        ? frameData.filter((f: { id: string }) => f.id !== "overallFrame").length
        : 0;
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
      if (err instanceof Error) {
        console.error("[Polling] Error during polling:", err.message);
      } else {
        console.error("[Polling] Unknown error during polling:", err);
      }
    } finally {
      isPolling = false;
    }
  }, 1000);

  try {
    console.log("[handleEvaluateWithParams] Calling evaluateDesign with params:", params);
    const evalResult = await evaluateDesign(params);
    console.log("[handleEvaluateWithParams] evaluateDesign result:", evalResult);
  } catch (e) {
    if (e instanceof Error) {
      console.error("[handleEvaluateWithParams] Evaluation error:", e.message);
      setEvalError(e.message || "Failed to evaluate");
    } else {
      console.error("[handleEvaluateWithParams] Unknown evaluation error:", e);
      setEvalError("Failed to evaluate");
    }
    if (pollInterval) clearInterval(pollInterval);
    setLoadingEval(false);
  }
}

export async function handleEvalParamsSubmit(
  params: Record<string, unknown>,
  handleEvaluateWithParams: (
    params: EvaluateInput,
    design: Design,
    setLoadingEval: Dispatch<SetStateAction<boolean>>,
    setEvalError: Dispatch<SetStateAction<string | null>>,
    setEvalResult: Dispatch<SetStateAction<EvalResponse | null>>,
    setFrameEvaluations: Dispatch<SetStateAction<any[]>>,
    setExpectedFrameCount: Dispatch<SetStateAction<number>>,
    setEvaluatedFramesCount: Dispatch<SetStateAction<number>>,
    fetchEvaluations: () => Promise<void>
  ) => Promise<void>,
  design: Design,
  setLoadingEval: React.Dispatch<React.SetStateAction<boolean>>,
  setEvalError: React.Dispatch<React.SetStateAction<string | null>>,
  setEvalResult: React.Dispatch<React.SetStateAction<EvalResponse | null>>,
  setFrameEvaluations: React.Dispatch<React.SetStateAction<any[]>>,
  setExpectedFrameCount: React.Dispatch<React.SetStateAction<number>>,
  setEvaluatedFramesCount: React.Dispatch<React.SetStateAction<number>>,
  fetchEvaluations: () => Promise<void>,
  setShowEvalParams: React.Dispatch<React.SetStateAction<boolean>>,
) {
  console.log("[handleEvalParamsSubmit] Closing modal and starting evaluation");
  setShowEvalParams(false);

  const latestSnapshot = {
    age: typeof params.generation === "string" ? params.generation : "",
    occupation: typeof params.occupation === "string" ? params.occupation : "",
  };

  console.log("[handleEvalParamsSubmit] Params for evaluation:", { ...params, snapshot: latestSnapshot });
  setLoadingEval(true);
  setEvalError(null);

  try {
    // Call backend to create new version and get versionId
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const response = await fetch(`${baseUrl}/api/start-evaluation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        design_id: design.id,
        created_by: design.owner_id, // or pass currentUserId if available
      }),
    });

    const result = await response.json();
    const versionId = result.versionId;

    if (!versionId || typeof versionId !== "string") {
      setEvalError("Failed to start evaluation: missing version ID.");
      setLoadingEval(false);
      return;
    }

    await handleEvaluateWithParams(
      {
        ...(params as EvaluateInput),
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

    // Poll for job progress until completed
    let done = false;
    while (!done) {
      try {
        const progressRes = await fetch(`${baseUrl}/api/ai/evaluate/progress?jobId=${versionId}`);
        const progressData = await progressRes.json();

        setEvaluatedFramesCount(typeof progressData.progress === "number" ? progressData.progress : 0);
        setExpectedFrameCount(100); // or use actual frame count if available

        if (progressData.status === "completed" || progressData.status === "error") {
          done = true;
          setLoadingEval(false);
          await fetchEvaluations();
        } else {
          await new Promise(res => setTimeout(res, 2000));
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error("[Polling] Error during polling:", err.message);
        } else {
          console.error("[Polling] Unknown error during polling:", err);
        }
        setLoadingEval(false);
        done = true;
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      setEvalError(e.message || "Failed to evaluate");
    } else {
      setEvalError("Failed to evaluate");
    }
    setLoadingEval(false);
  }
}