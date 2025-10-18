import { createClient } from "@/utils/supabase/client";
import { evaluateDesign } from "@/lib/evaluteDesign/evaluateDesign";
import type { Design } from "@/lib/types/designTypes";
import type { Dispatch, SetStateAction } from "react";
import type { EvalResponse } from "@/lib/types/evalResponse";

/**
 * Factory that returns a bound evaluate handler.
 * Use a getter for design to avoid stale closures.
 */
export function createHandleEvaluate(options: {
  getDesign: () => Design | null;
  setLoadingEval: (b: boolean) => void;
  setEvalError: (v: string | null) => void;
  setEvalResult: (r: EvalResponse | null) => void;
  setDesign: Dispatch<SetStateAction<Design | null>>;
  setLoadingVersions: (b: boolean) => void;
}) {
  const { getDesign, setLoadingEval, setEvalError, setEvalResult, setDesign, setLoadingVersions } = options;

  return async function handleEvaluate() {
    const design = getDesign();
    if (!design?.id || !design?.fileKey) {
      console.error("Missing required design data:", { id: design?.id, fileKey: design?.fileKey });
      setEvalError("Missing required design data");
      return;
    }

    setLoadingEval(true);
    setEvalError(null);

    try {
      let imageUrlForAI = design.thumbnail;
      if (imageUrlForAI && !imageUrlForAI.startsWith("http")) {
        const supabase = createClient();
        const { data: signed } = await supabase.storage
          .from("design-thumbnails")
          .createSignedUrl(imageUrlForAI, 3600);

        if (signed?.signedUrl) {
          imageUrlForAI = signed.signedUrl;
        }
      }

      console.log("Starting evaluation with:", {
        designId: design.id,
        fileKey: design.fileKey,
        nodeId: design.nodeId,
        thumbnail: imageUrlForAI,
        snapshot: design.snapshot,
        url: design.figma_link,
      });

      const data = await evaluateDesign({
        designId: design.id,
        fileKey: design.fileKey,
        nodeId: design.nodeId,
        fallbackImageUrl: imageUrlForAI,
        snapshot: typeof design?.snapshot === "string" ? JSON.parse(design.snapshot) : design?.snapshot,
        url: design.figma_link,
        frameIds: design?.frames?.map((f) => String(f.id)) ?? [],
        versionId: design.current_version_id || "",
      });

      console.log("Evaluation successful:", data);
      setEvalResult(data[0] ?? null);

      try {
        const supabase = createClient();
        const { data: updatedDesign, error } = await supabase
          .from("designs")
          .select("id, current_version_id")
          .eq("id", design.id)
          .single();

        if (!error && updatedDesign) {
          setDesign((prev) => (prev ? { ...prev, current_version_id: updatedDesign.current_version_id } : prev));
        }
      } catch (err) {
        console.error("Failed to refresh current_version_id after evaluation:", err);
      }

      setLoadingVersions(true);
    } catch (e: any) {
      console.error("Evaluation failed:", e);
      setEvalError(e?.message || "Failed to evaluate");
    } finally {
      setLoadingEval(false);
      setLoadingVersions(false);
    }
  };
}