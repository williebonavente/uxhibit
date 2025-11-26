"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { FrameCarousel } from "@/components/carousel/frame-carousel";
import { IconLink } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EvalResponse } from "@/app/designs/[id]/page";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
type ParsedMeta = {
  fileKey: string;
  nodeId?: string;
  name?: string;
  thumbnail?: string;
  frameImages?: Record<string, string>;
  type?: string;
  uploadedFileName?: string;
  uploadedAt?: string; // ISO timestamp
};

export default function Evaluate() {
  const pollControllerRef = useRef<AbortController | null>(null);
  const isPollingRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      try {
        pollControllerRef.current?.abort();
      } catch (e) {}
      pollControllerRef.current = null;
      isPollingRef.current = false;
    };
  }, []);

  const cardCursor: React.CSSProperties = {
    cursor:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' stroke='%23ffffff' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3l7 17 2-7 7-2-16-8Z'/></svg>\") 3 3, pointer",
  };

  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const supabase = createClient();

  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [link, setLink] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedMeta | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [evaluatedFrames, setEvaluatedFrames] = useState<EvalResponse[]>([]);

  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);
  const [expectedFrameCount, setExpectedFrameCount] = useState<number>(0);
  const [loadingEval, setLoadingEval] = useState(false);
  const [showFullLink, setShowFullLink] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"link" | "file" | null>(
    null
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [showParsedDetails, setShowParsedDetails] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(
    null
  );
  const [initialCountdown, setInitialCountdown] = useState<number | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const canNextFrom1 = !!age && !!occupation;
  const canParse =
    (uploadMethod === "link" && !!link && !parsing) ||
    (uploadMethod === "file" && uploadedFiles.length > 0 && !parsing);

  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) {
      setInitialCountdown(null);
      return;
    }

    // Set initial value on first countdown
    if (initialCountdown === null) {
      setInitialCountdown(rateLimitCountdown);
    }

    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitCountdown, initialCountdown]);

  async function handleParse() {
    if (!age || !occupation) {
      toast.error("Select parameters first.");
      return;
    }

    // Check if we're in cooldown
    if (rateLimitCountdown !== null && rateLimitCountdown > 0) {
      toast.error(
        `Please wait ${rateLimitCountdown} seconds before trying again.`
      );
      return;
    }

    // Validate based on upload method
    if (uploadMethod === "link" && !link.trim()) {
      toast.error("Enter a Figma link.");
      return;
    }

    if (uploadMethod === "file" && !uploadedFile) {
      toast.error("Please upload an image file.");
      return;
    }

    setParsing(true);

    try {
      let data;

      if (uploadMethod === "link") {
        // Handle Figma link parsing with retry logic
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/figma/parse`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ url: link, force: true }),
          }
        );

        if (res.status === 429) {
          const errorData = await res.json();
          const retryAfter = errorData.retryAfter || 60;

          // Start countdown
          setRateLimitCountdown(retryAfter);

          // Toast with manual dismiss - no auto-dismiss
          toast.error(
            `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
            {
              duration: Infinity, // Won't auto-dismiss
              description: "Too many requests in a short time period",
              action: {
                label: "✕",
                onClick: () => {
                  // Toast will close when clicked
                },
              },
            }
          );

          setParsing(false);
          return;
        }

        if (!res.ok) {
          const errorData = await res.json();

          if (errorData.code === "FIGMA_RATE_LIMIT") {
            const retryAfter = errorData.retryAfter || 60;
            setRateLimitCountdown(retryAfter);

            // Toast with manual dismiss
            toast.error(
              "Figma API rate limit reached. Please wait a moment before trying again.",
              {
                duration: Infinity, // Won't auto-dismiss
                description: "Figma allows 150 requests per minute per token",
                action: {
                  label: "✕",
                  onClick: () => {
                    // Toast will close when clicked
                  },
                },
              }
            );
          } else {
            toast.error(errorData.error || "Failed to parse Figma link", {
              description: "Please check your link and try again",
              action: {
                label: "✕",
                onClick: () => {},
              },
            });
          }

          setParsing(false);
          return;
        }

        data = await res.json();
      } else if (uploadMethod === "file" && uploadedFiles.length > 0) {
        const formData = new FormData();
        for (const f of uploadedFiles) {
          formData.append("files", f); // send all files under "files"
        }
        formData.append("age", age);
        formData.append("occupation", occupation);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/figma/parse-file`,
          { method: "POST", body: formData }
        );

        if (res.status === 429) {
          const errorData = await res.json();
          const retryAfter = errorData.retryAfter || 60;

          // Start countdown
          setRateLimitCountdown(retryAfter);

          // Toast with manual dismiss
          toast.error(
            `Too many uploads. Please wait ${retryAfter} seconds before trying again.`,
            {
              duration: Infinity, // Won't auto-dismiss
              action: {
                label: "✕",
                onClick: () => {
                  // Toast will close when clicked
                },
              },
            }
          );

          setParsing(false);
          return;
        }

        if (!res.ok) {
          const error = await res
            .json()
            .catch(() => ({ error: "Parse failed" }));
          toast.error(error?.error || "Failed to parse file", {
            description: "Please check the file and try again",
            action: {
              label: "✕",
              onClick: () => {},
            },
          });
          setParsing(false);
          return;
        }

        data = await res.json();
        if (data.cached) {
          if (data.stale) {
            toast.warning("Using cached data (rate limited)", {
              description: `Cache age: ${data.cacheAge}s. Fresh data unavailable due to rate limits.`,
            });
          } else {
            toast.info("Loaded from cache", {
              description: `Cache age: ${data.cacheAge}s. No API calls made.`,
            });
          }
        }
        // Debug logging
        console.log("[handleParse] API Response:", data);
        console.log("[handleParse] Frame Images:", data.frameImages);
        console.log(
          "[handleParse] Frame Count:",
          Object.keys(data.frameImages || {}).length
        );
      }

      if (!data) {
        toast.error("Failed to parse design", {
          action: {
            label: "✕",
            onClick: () => {},
          },
        });
        setParsing(false);
        return;
      }

      const parsedData = {
        fileKey: data.fileKey,
        nodeId: data.nodeId,
        name: data.name || uploadedFile?.name || "Untitled",
        thumbnail: data.nodeImageUrl || data.thumbnailUrl || null,
        frameImages: data.frameImages || {},
        type: data.type,
        uploadedFileName: uploadedFile?.name,
        uploadedAt: new Date().toISOString(),
      };
      console.log("[handleParse] Setting parsed data:", parsedData);
      console.log(
        "[handleParse] Frame images count:",
        Object.keys(parsedData.frameImages).length
      );

      setParsed(parsedData);

      toast.success(
        `Design parsed successfully - ${
          Object.keys(parsedData.frameImages).length
        } frames found`
      );

      setStep(3);
    } catch (error: any) {
      console.error("Parse error:", error);

      // Check for network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        toast.error("Network error - please check your connection");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit() {
    console.log("[handleSubmit] Started");

    if (!parsed) {
      console.log("[handleSubmit] No parsed design");
      toast.error("No parsed design");
      return;
    }
    if (!age || !occupation) {
      console.log("[handleSubmit] Parameters missing", { age, occupation });
      toast.error("Parameters missing");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("[handleSubmit] Supabase session", session);

    if (!session?.user) {
      console.log("[handleSubmit] Sign in required");
      toast.error("Sign in required.");
      return;
    }

    const frameEntries = Object.entries(parsed.frameImages || {});
    console.log("[handleSubmit] Frame entries", frameEntries);

    if (frameEntries.length === 0) {
      console.log("[handleSubmit] No frames found in parsed design");
      toast.error("Invalid Design");
      setStep(2);
      return;
    }

    setExpectedFrameCount(frameEntries.length);
    setStep(4);

    setSubmitting(true);
    try {
      console.log("[handleSubmit] Saving design to API", {
        title: parsed.name,
        figma_link: link,
        file_key: parsed.fileKey,
        node_id: parsed.nodeId,
        thumbnail_url: parsed.thumbnail,
        age,
        occupation,
        snapshot: { age, occupation },
      });

      let precheckedExisting: any = null;
      try {
        const checkRes = await fetch(
          `/api/designs?file_key=${encodeURIComponent(parsed.fileKey)}`
        );


        // TODO: FIX THIS!!

              const evalRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: uploadMethod,           // "link" | "file"
          link,                           // when method === "link"
          frames: parsed.frameImages,     // when method === "file"
          meta: { age, occupation, file_key: parsed.fileKey, node_id: parsed.nodeId },
        }),
      });

            console.log("[handleSubmit] AI evaluate response status", evalRes.status);

                  // Hard stop on any 4xx from /api/ai/evaluate
      if (evalRes.status >= 400 && evalRes.status < 500) {
        const evalJson = await evalRes.json().catch(() => ({}));
        const msg = evalJson?.error || evalJson?.message || evalRes.statusText || "AI evaluate failed";
        setEvalError(msg);
        toast.error(`[AI Evaluate] ${msg}`);

        // Route back to the logical step based on input method
        if (uploadMethod === "link") {
          setStep(2); // fix the link
        } else {
          setStep(3); // review upload details
        }
        setSubmitting(false);
        setLoadingEval(false);
        return;
      }

      // Optional: treat ok:false or status:error as failure even with 200
      const evalData = await evalRes.json().catch(() => ({}));
      if (
        evalData?.ok === false ||
        String(evalData?.status || "").toLowerCase() === "error" ||
        evalData?.error
      ) {
        const msg = evalData?.error || evalData?.message || "AI evaluate failed";
        setEvalError(msg);
        toast.error(`[AI Evaluate] ${msg}`);
        setSubmitting(false);
        setLoadingEval(false);
        setStep(uploadMethod === "link" ? 2 : 3);
        return;
      }


        if (checkRes.status === 405) {
          toast.error("Pre-check endpoint not implemented (405) - skipping precheck");
          console.warn("[handleSubmit] Pre-check endpoint not implemented (405) - skipping precheck");
          setStep(3);
          return;
        } else if (checkRes.status >= 500) {
          const body = await checkRes.text().catch(() => "");
          const msg = body ? body : checkRes.statusText || "Server error";
          toast.error(`Server error during pre-check: ${msg}`);
          setStep(3);
          setSubmitting(false);
          return;
        } else if (checkRes.status >= 400 && checkRes.status < 500) {
          // Handle client-side errors explicitly and stop flow
          const bodyText = await checkRes.text().catch(() => "");
          let bodyJson: any = null;
          try { bodyJson = JSON.parse(bodyText); } catch {}
          const msg = bodyJson?.error || bodyText || "Invalid request";
          toast.error(`Pre-check failed (${checkRes.status}): ${msg}`);
          console.warn("[handleSubmit] Pre-check failed", checkRes.status, msg);
          setStep(3);
          setSubmitting(false);
          return;
        } else if (!checkRes.ok) {
          const body = await checkRes.text().catch(() => "(no body)");
          console.warn("[handleSubmit] Pre-check non-ok response", checkRes.status, body);
        } else {
          precheckedExisting = await checkRes.json().catch(() => null);
          if (precheckedExisting?.design?.id) {
            console.log("[handleSubmit] Found existing design by file_key", precheckedExisting.design.id);
          }
        }
      } catch (e) {
        console.warn(
          "[handleSubmit] pre-save check failed (network), continuing to save",
          e
        );
      }

      const saveRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/designs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: parsed.name,
            figma_link: link,
            file_key: parsed.fileKey,
            node_id: parsed.nodeId,
            thumbnail_url: parsed.thumbnail,
            age,
            occupation,
            snapshot: { age, occupation },
          }),
        }
      );
      console.log("[handleSubmit] Save response status", saveRes.status);

      const saved = await saveRes.json().catch(() => ({}));

          // Immediate stop on any 4xx save response (surface backend message)
      if (saveRes.status >= 400 && saveRes.status < 500) {
        const msg = saved?.error || saved?.message || saveRes.statusText || "Save failed";
        toast.error(`AI evaluation failed: ${msg}`);
        setSubmitting(false);
        setLoadingEval(false);
        setStep(uploadMethod === "link" ? 2 : 3);
        return;
      }


            // If backend returned an error message, surface it and stop
      if (saved?.error || (saveRes.status >= 400 && saveRes.status < 500)) {
        const msg = saved?.error || saveRes.statusText || "Save failed";
        toast.error(`AI evaluation failed: ${msg}`);
        setSubmitting(false);
        setStep(3);
        return;
      }

           // Also stop if backend included an error field
      if (saved?.error) {
        toast.error(`AI evaluation failed: ${saved.error}`);
        setSubmitting(false);
        setStep(3);
        return;
      }

      const designId =
        saved?.design?.id ??
        saved?.id ??
        saved?.design_id ??
        saved?.data?.design?.id ??
        null;

              if (!saveRes.ok || !designId) {
        console.log("[handleSubmit] Save failed or missing design id", { status: saveRes.status, saved });
        toast.error(saved?.error || "Save failed (no design id).");
        setSubmitting(false);
        setLoadingEval(false);
        setStep(3);
        return;
      }

       // Hard guard: do not start polling if required inputs are missing for chosen method
      if (uploadMethod === "link" && (!link || !link.trim())) {
        toast.error("Missing design link. Cannot start evaluation.");
        setSubmitting(false);
        setLoadingEval(false);
        setStep(3);
        return;
      }

      
      // Hard guard: inputs required for chosen method
      const expectedNodeIds = Object.keys(parsed.frameImages || {});
      if (uploadMethod === "link" && (!link || !link.trim())) {
        const msg = "Missing design link. Cannot start evaluation.";
        setEvalError(msg);
        toast.error(msg);
        setSubmitting(false);
        setLoadingEval(false);
        setStep(2);
        return;
      }

      if (uploadMethod === "file" && expectedNodeIds.length === 0) {
        const msg = "No frames found from uploaded images. Cannot start evaluation."
        setSubmitting(false);
        setEvalError(msg);
        setStep(2);
        return;
      }

      if (saved?.ai_started === false || saved?.evaluation_started === false) {
        const msg = saved?.message || "Evaluatoin did not start";
        setEvalError(msg);
        toast.error(msg);
        setSubmitting(false);
        setLoadingEval(false);
        setStep(3);
        return;
      }
      
      let resolvedVersionId = saved?.version_id ?? null;
      if (!resolvedVersionId) {
        try {
          const vres = await fetch(`/api/designs/${designId}/versions`);
          if (vres.ok) {
            const vdata = await vres.json().catch(() => null);
            const newest = Array.isArray(vdata?.versions) && vdata.versions[0];
            if (newest?.id) {
              resolvedVersionId = newest.id;
              console.log(
                "[handleSubmit] Resolved version_id from versions endpoint",
                resolvedVersionId
              );
            } else {
              console.warn(
                "[handleSubmit] No versions returned when resolving version_id",
                vdata
              );
            }
          } else {
            console.warn(
              "[handleSubmit] Failed to fetch versions for design",
              designId,
              vres.status
            );
          }
        } catch (e) {
          console.warn(
            "[handleSubmit] Error resolving version_id, proceeding without it",
            e
          );
        }
      }
      if (resolvedVersionId) {
        saved.version_id = resolvedVersionId;
      } else {
        console.warn(
          "[handleSubmit] No version_id available — polling may miss worker updates"
        );
      }

      // Prefer existing design from pre-check if present
      if (precheckedExisting?.design?.id && !saved?.design?.id && !saved?.id) {
        saved.design = saved.design ?? {};
        saved.design.id = precheckedExisting.design.id;
        if (precheckedExisting.design.version_id)
          saved.version_id = precheckedExisting.design.version_id;
        console.log(
          "[handleSubmit] Using prechecked existing design data",
          saved
        );
      }

      // Normalize returned design id (handle different backend shapes)

      setSavedDesignId(designId);
      console.log(
        "[handleSubmit] Normalized design Id",
        designId,
        "version_id:",
        saved?.version_id
      );

      // Polling with AbortController, version param, robust guards
      // abort any previous poll, create a new controller for this session
      setLoadingEval(true);
      try {
        pollControllerRef.current?.abort();
      } catch (e) {}
      pollControllerRef.current = new AbortController();
      const controller = pollControllerRef.current;
      let pollCount = 0;
      let frames: EvalResponse[] = [];
      const maxPolls = 60;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const expectedIds = Object.keys(parsed.frameImages || {});
      const versionParam = saved?.version_id
        ? `&version=${saved.version_id}`
        : "";

            let emptyStreak = 0;
      const maxEmptyStreak = 8;

      try {
         while (pollCount < maxPolls) {
         pollCount++;
          console.log(`[handleSubmit] Polling evaluation (attempt ${pollCount}) for design ID: ${designId} version:${saved?.version_id ?? "n/a"}`);

          let res: Response | null = null;
          let data: any = null;
          try {
            res = await fetch(
              `${baseUrl}/api/designs/${designId}/evaluations?ts=${Date.now()}${versionParam}`,
              { cache: "no-store", signal: controller.signal }
            );
          } catch (err: any) {
            if (err?.name === "AbortError") {
              console.log("[handleSubmit] Polling aborted");
              break;
            }
            console.error("[handleSubmit] Network error while polling:", err);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }

          // Stop immediately on 4xx from evaluations
          if (res.status >= 400 && res.status < 500) {
            let errMsg = "";
            try { const j = await res.json(); errMsg = j?.error || j?.message || ""; } catch {}
            const msg = errMsg || res.statusText || "Evaluation error";
            setEvalError(msg);
            toast.error(`Evaluation error (${res.status}): ${msg}`);
            setLoadingEval(false);
            setStep(3);
            break;
          }

          try {
            data = await res.json();
          } catch (err) {
            console.error("[handleSubmit] Failed to parse evaluation JSON:", err);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }

          // Backend error statuses
          if (data?.status === "error" || data?.error) {
            const msg = data?.error || data?.message || "Evaluation failed";
            setEvalError(msg);
            toast.error(`Evaluation stopped: ${msg}`);
            setLoadingEval(false);
            setStep(3);
            break;
          }
          if (data?.status === "not_found") {
            const msg = "Evaluation not found for this design.";
            setEvalError(msg);
            toast.warning(`${msg} Stopping polling.`);
            setLoadingEval(false);
            setStep(3);
            break;
          }

          const results = Array.isArray(data?.results) ? data.results : [];

          // Empty progress safeguard
          if (results.length === 0) {
            emptyStreak++;
            if (emptyStreak >= maxEmptyStreak) {
              const msg = "Evaluation did not start. Please check your inputs.";
              console.warn("[handleSubmit] No evaluation progress; stopping polling.");
              setEvalError(msg);
              toast.warning(msg);
              setLoadingEval(false);
              setStep(3);
              break;
            }
          } else {
            emptyStreak = 0;
          }

          frames = results.filter((f: any) => expectedIds.includes(f.nodeId ?? f.node_id));
          setEvaluatedFrames(frames);

          if (frames.length === expectedIds.length) {
            setLoadingEval(false);
            try { window.dispatchEvent(new Event("uxhibit:soft-refresh")); } catch {}
            toast.success("Design and AI evaluation completed for all frames");
            try { controller.abort(); } catch {}
            pollControllerRef.current = null;
            isPollingRef.current = false;
            router.push(`/designs/${designId}`);
            return;
          }

          const returnedIds = results.map((r: any) => (r.nodeId ?? r.node_id));
          if (returnedIds.length > 0 && pollCount > 10 && frames.length === 0) {
            const msg = "Evaluation returned unexpected frame ids. Check node mapping.";
            console.warn("[handleSubmit] Unexpected node ids; aborting.", { expectedIds, returnedIds });
            setEvalError(msg);
            toast.warning(msg);
            setLoadingEval(false);
            setStep(3);
            break;
          }

          if (data?.status === "done") {
            setLoadingEval(false);
            try { window.dispatchEvent(new Event("uxhibit:soft-refresh")); } catch {}
            console.log("[handleSubmit] Backend marked done but not all frames present");
            break;
          }

          await new Promise((r) => setTimeout(r, 2000));
        }
      } finally {
        // ensure controller cleaned up
        try {
          controller.abort();
        } catch (e) {}
        isPollingRef.current = false;
      }

      if (loadingEval) {
        setLoadingEval(false);
        try {
          window.dispatchEvent(new Event("uxhibit:soft-refresh"));
        } catch {}
      }

      // End of polling: route consistently using normalized id
      if (frames.length < expectedIds.length) {
        console.log(
          "[handleSubmit] Polling finished without completing all frames",
          { framesEvaluated: frames.length, expected: expectedIds.length }
        );
        if (!evalError) {
          setEvalError("Design saved, but AI evaluation did not complete.")
          toast.warning("Design saved, but AI evaluation did not complete.");
          router.push(`/designs/${designId}`);
        }
      }
    } catch (error) {
      console.error("[handleSubmit] Submit failed:", error);
      toast.error("Submit failed");
    } finally {
      setSubmitting(false);
      console.log("[handleSubmit] Finished");
    }
  }

  useEffect(() => {
    const handler = () => {
      // trigger a local visual cue or re-fetch lightweight data here.
      console.log("[Evaluate] Soft refresh event received");
    };
    window.addEventListener("uxhibit:soft-refresh", handler);
    return () => window.removeEventListener("uxhibit:soft-refresh", handler);
  }, []);

  function resetAll() {
    setStep(1);
    setAge("");
    setOccupation("");
    setLink("");
    setParsed(null);
    setSubmitting(false);
    setParsing(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={cardCursor}
    >
      <div
        className="relative pt-2 md:pt-4 pb-6 md:pb-8 flex flex-col gap-8"
        style={cardCursor}
      >
        {/* Step Indicator */}

        <div className="flex items-center justify-center gap-5 text-xs font-medium tracking-wide p-2 rounded-full mt-0">
          {[1, 2, 3, 4].map((n, i) => (
            <div key={n} className="flex items-center gap-3">
              {/* Step Circle */}
              <span
                className={`relative h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all
            ${
              step === n
                ? "bg-[#ED5E20] text-white drop-shadow-[0_0_8px_#ED5E20] animate-pulse"
                : step > n
                ? "bg-[#ED5E20] text-white"
                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
            }`}
              >
                {n}
              </span>
              {/* Step Label */}
              <span
                className={`hidden sm:inline text-sm ${
                  step >= n
                    ? "text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 dark:text-neutral-600"
                }`}
              >
                {n === 1 && "Parameters"}
                {n === 2 && "Upload"}
                {n === 3 && "Review"}
                {n === 4 && "Evaluation"}
              </span>
              {/* Connector Line */}
              {i < 3 && (
                <div
                  className={`h-0.5 w-14 rounded-full transition-colors duration-300
              ${
                step > n ? "bg-[#ED5E20]" : "bg-neutral-300 dark:bg-neutral-700"
              }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <p className="text-lg font-bold uppercase text-[#ED5E20]">
                Select Target Audience&apos;s Generation & Occupation
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                These guide how the evaluation is framed.
              </p>
            </div>

            <fieldset className="grid grid-cols-1 gap-6">
              {/* Generation */}
              <label
                className="group relative flex flex-col rounded-xl
                                bg-accent dark:bg-neutral-800/60
                                text-white
                                p-5
                                transition-colors
                                focus-within:ring-1 focus-within:ring-[#ED5E20]/70 focus-within:border-[#ED5E20 border"
                style={cardCursor}
              >
                <span className="text-[15px] font-semibold text-[#ED5E20] mb-2">
                  Generation
                </span>
                {!age && (
                  <span className="text-[13px] text-neutral-700 dark:text-neutral-500 mb-5">
                    Please select a target age.
                  </span>
                )}
                <div className="relative flex items-center gap-2">
                  <svg
                    className="h-8 w-8 text-[#ED5E20]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <Select value={age} onValueChange={setAge}>
                    <SelectTrigger className="w-full rounded-lg bg-white dark:bg-neutral-800/70 text-sm font-medium text-neutral-900 dark:text-neutral-200 px-3 py-2">
                      <SelectValue placeholder="Select Generation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gen Z">Gen Z (1997-2012)</SelectItem>
                      <SelectItem value="Millennial">
                        Millennial (1981-1996)
                      </SelectItem>
                      <SelectItem value="Gen Alpha">
                        Gen Alpha (2013-Present)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </label>

              {/* Occupation */}
              <label
                className="group relative flex flex-col rounded-xl
                                bg-accent dark:bg-neutral-800/60 text-white
                                p-5 transition-colors focus-within:ring-1 focus-within:ring-[#ED5E20]/70 focus-within:border-[#ED5E20 border"
                style={cardCursor}
              >
                <span className="text-[15px] font-semibold text-[#ED5E20] mb-2">
                  Occupation
                </span>
                {!occupation && (
                  <span className="text-[13px] text-neutral-700 dark:text-neutral-500 mb-5">
                    Please select a target role.
                  </span>
                )}
                <div className="relative flex items-center gap-2">
                  <svg
                    className="h-8 w-8 text-[#ED5E20]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                  <Select value={occupation} onValueChange={setOccupation}>
                    <SelectTrigger className="w-full rounded-lg bg-white dark:bg-neutral-800/70 text-sm font-medium text-neutral-900 dark:text-neutral-200 px-3 py-2">
                      <SelectValue placeholder="Select Occupation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Freelancer">Freelancer</SelectItem>
                      <SelectItem value="Designer">Designer</SelectItem>
                      <SelectItem value="Developer">Developer</SelectItem>
                      <SelectItem value="Educator">Educator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </label>
            </fieldset>

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
              <Button
                onClick={resetAll}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium
                  border border-neutral-300/70 dark:border-neutral-600/60 
                  bg-white/60 dark:bg-neutral-800/50
                  text-neutral-700 dark:text-neutral-200
                  shadow-sm backdrop-blur
                  hover:bg-white/80 dark:hover:bg-neutral-800/70
                  hover:border-neutral-400 dark:hover:border-neutral-500
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                  focus:ring-offset-white dark:focus:ring- cursor-pointer"
                type="button"
              >
                <svg
                  className="h-4 w-4 opacity-80"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M10 4a6 6 0 1 1-5.657 4H3.5A.5.5 0 0 1 3 7.5V3.6a.6.6 0 0 1 .6-.6H7.5a.5.5 0 0 1 .5.5v.843A6.002 6.002 0 0 1 10 4Z" />
                </svg>
                Reset
              </Button>

              <button
                disabled={!canNextFrom1}
                onClick={() => canNextFrom1 && setStep(2)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer
                    ${
                      canNextFrom1
                        ? "bg-[#ED5E20] hover:bg-orange-600"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-bold uppercase text-[#ED5E20]">
                Upload Your Design
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Choose how you want to provide your design
              </p>
            </div>

            {/* Preview Section */}

            {/* Upload Method Selection */}
            {!uploadMethod ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Figma Link Card */}
                <button
                  onClick={() => setUploadMethod("link")}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ED5E20]/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white dark:bg-neutral-800/60 rounded-2xl p-8 border-2 border-neutral-200 dark:border-neutral-700 hover:border-[#ED5E20] transition-all duration-300 h-full flex flex-col items-center justify-center text-center gap-4">
                    <div className="p-4 bg-[#ED5E20]/10 rounded-2xl">
                      <IconLink size={48} className="text-[#ED5E20]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                        Figma Link
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Paste a link from figma.com
                      </p>
                    </div>
                    <div className="mt-auto pt-4">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-[#ED5E20]">
                        Select
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M7 3l5 5-5 5" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </button>

                {/* File Upload Card */}
                <button
                  onClick={() => setUploadMethod("file")}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-[#ED5E20]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white dark:bg-neutral-800/60 rounded-2xl p-8 border-2 border-neutral-200 dark:border-neutral-700 hover:border-[#ED5E20] transition-all duration-300 h-full flex flex-col items-center justify-center text-center gap-4">
                    <div className="p-4 bg-[#ED5E20]/10 rounded-2xl">
                      <svg
                        className="h-12 w-12 text-[#ED5E20]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                        Upload File
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Upload .fig files or design images
                      </p>
                    </div>
                    <div className="mt-auto pt-4">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-[#ED5E20]">
                        Select
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M7 3l5 5-5 5" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <>
                {/* Selected Method Header */}
                <div className="flex items-center justify-between p-4 bg-[#ED5E20]/5 rounded-xl border border-[#ED5E20]/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ED5E20]/10 rounded-lg">
                      {uploadMethod === "link" ? (
                        <IconLink size={20} className="text-[#ED5E20]" />
                      ) : (
                        <svg
                          className="h-5 w-5 text-[#ED5E20]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {uploadMethod === "link"
                          ? "Using Figma Link"
                          : "Using File Upload"}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {uploadMethod === "link"
                          ? "Paste your design link below"
                          : "Upload the images  below"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadMethod(null);
                      setLink("");
                      setUploadedFile(null);
                      setParsed(null);
                    }}
                    className="cursor-pointer text-sm text-neutral-600 dark:text-neutral-400 hover:text-[#ED5E20] transition-colors underline"
                  >
                    Change method
                  </button>
                </div>

                {/* Figma Link Input */}
                {uploadMethod === "link" && (
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ED5E20]/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative bg-white dark:bg-neutral-800/60 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 hover:border-[#ED5E20]/50 transition-all duration-300">
                        <div className="space-y-2">
                          <Input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://www.figma.com/design/..."
                            disabled={rateLimitCountdown !== null}
                            className="w-full h-12 px-4 rounded-lg bg-accent/10 dark:bg-neutral-900/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED5E20]/50 border-neutral-200 dark:border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          />

                          {/* Show full link toggle */}
                          {link && link.length > 50 && (
                            <div className="flex items-center justify-between px-2">
                              <button
                                type="button"
                                onClick={() => setShowFullLink(!showFullLink)}
                                className="flex items-center gap-1 text-xs text-[#ED5E20] hover:text-orange-600 transition-colors"
                              >
                                <svg
                                  className="h-3 w-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  {showFullLink ? (
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                                  ) : (
                                    <>
                                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                      <line x1="1" y1="1" x2="23" y2="23" />
                                    </>
                                  )}
                                </svg>
                                {showFullLink
                                  ? "Hide full link"
                                  : "Show full link"}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(link);
                                  toast.success("Link copied to clipboard!");
                                }}
                                className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-[#ED5E20] transition-colors"
                              >
                                <svg
                                  className="h-3 w-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="9"
                                    y="9"
                                    width="13"
                                    height="13"
                                    rx="2"
                                    ry="2"
                                  />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                Copy
                              </button>
                            </div>
                          )}

                          {showFullLink && link && (
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-900/80 rounded-lg border border-neutral-200 dark:border-neutral-700">
                              <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300 break-all">
                                {link}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rate Limit Warning Banner */}
                    {rateLimitCountdown !== null && (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex-shrink-0 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <svg
                            className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                            Rate Limit Active
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                            Too many requests detected. Please wait before
                            parsing again.
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-amber-200 dark:bg-amber-900/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 dark:bg-amber-600 transition-all duration-1000 ease-linear"
                                style={{
                                  width: initialCountdown
                                    ? `${
                                        ((initialCountdown -
                                          rateLimitCountdown) /
                                          initialCountdown) *
                                        100
                                      }%`
                                    : "0%",
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-amber-900 dark:text-amber-100 tabular-nums min-w-[3ch]">
                              {rateLimitCountdown}s
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* File Upload */}
                {uploadMethod === "file" && (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-[#ED5E20]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-white dark:bg-neutral-800/60 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 hover:border-[#ED5E20]/50 transition-all duration-300">
                      {!uploadedFile ? (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl cursor-pointer hover:border-[#ED5E20]/50 transition-colors">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="p-3 bg-[#ED5E20]/10 rounded-xl">
                              <svg
                                className="h-8 w-8 text-[#ED5E20]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 5v14M5 12l7-7 7 7" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Click to upload design images
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                PNG, JPG, JPEG, or WEBP (max 10MB per file)
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                Support for multiple files
                              </p>
                            </div>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            multiple
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) return;

                              const validExtensions = [
                                ".png",
                                ".jpg",
                                ".jpeg",
                                ".webp",
                              ];
                              const maxSize = 10 * 1024 * 1024;

                              for (const file of files) {
                                const ext = file.name
                                  .toLowerCase()
                                  .substring(file.name.lastIndexOf("."));
                                if (!validExtensions.includes(ext)) {
                                  toast.error(
                                    `${file.name}: Invalid file type. Only PNG, JPG, JPEG, and WEBP are supported.`
                                  );
                                  e.target.value = "";
                                  return;
                                }
                                if (file.size > maxSize) {
                                  toast.error(
                                    `${file.name}: File too large. Maximum size is 10MB.`
                                  );
                                  e.target.value = "";
                                  return;
                                }
                              }

                              // Store all files; use the first for preview
                              setUploadedFiles(files);
                              const firstFile = files[0];
                              setUploadedFile(firstFile);

                              // Build data URLs for all files (for local preview carousel)
                              const reads = files.map(
                                (f) =>
                                  new Promise<string>((resolve, reject) => {
                                    const r = new FileReader();
                                    r.onload = () =>
                                      resolve(r.result as string);
                                    r.onerror = reject;
                                    r.readAsDataURL(f);
                                  })
                              );
                              try {
                                const previews = await Promise.all(reads);
                                setFilePreviews(previews);
                              } catch {
                                toast.error("Failed to build previews.");
                              }

                              toast.success(
                                `${files.length} file${
                                  files.length > 1 ? "s" : ""
                                } selected`
                              );
                            }}
                          />
                        </label>
                      ) : (
                        <div className="space-y-4">
                          {/* File Preview */}
                          <div className="space-y-3">
                            {/* Image Preview */}
                            <div className="relative rounded-xl overflow-hidden border-2 border-[#ED5E20]/20">
                              {/* Image Preview */}
                              {filePreviews.length > 1 && (
                                <div className="mt-3">
                                  <FrameCarousel
                                    frameImages={filePreviews.reduce(
                                      (acc, url, i) => {
                                        acc[`local_${i}`] = url;
                                        return acc;
                                      },
                                      {} as Record<string, string>
                                    )}
                                  />
                                </div>
                              )}
                            </div>

                            {/* File Info Card */}
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
                              <div className="flex-shrink-0 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <svg
                                  className="h-8 w-8 text-green-600 dark:text-green-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-green-900 dark:text-green-100 truncate">
                                  {uploadedFile.name}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                  {(uploadedFile.size / 1024).toFixed(2)} KB •{" "}
                                  {uploadedFile.name
                                    .substring(
                                      uploadedFile.name.lastIndexOf(".")
                                    )
                                    .toUpperCase()}{" "}
                                  Image
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setUploadedFile(null);
                                }}
                                className="flex-shrink-0 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Remove file"
                              >
                                <svg
                                  className="h-5 w-5 text-red-600 dark:text-red-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* File Info */}
                          <div className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <svg
                              className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <p className="text-blue-900 dark:text-blue-100">
                              Image ready for parsing. Click &apos;Parse&apos;
                              below to analyze your design.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Info tooltip - shown when no file uploaded */}
                      {!uploadedFile && (
                        <div className="mt-4 flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <svg
                            className="h-4 w-4 flex-shrink-0 mt-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          <p>
                            Upload design images exported from Figma or other
                            design tools. Supported formats: PNG, JPG, JPEG,
                            WEBP. You can select multiple files at once.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {parsed && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#ED5E20]/10 to-orange-500/10 rounded-2xl blur-2xl" />
                <div className="relative bg-white/80 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  {/* Collapsible Header Button */}
                  <button
                    type="button"
                    onClick={() => setShowParsedDetails(!showParsedDetails)}
                    className="w-full p-5 flex items-center justify-between hover:bg-[#ED5E20]/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Success Icon */}
                      <div className="flex-shrink-0 p-2.5 bg-green-500/10 rounded-xl">
                        <svg
                          className="h-6 w-6 text-green-600 dark:text-green-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>

                      {/* File Info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                            {parsed.name}
                          </h3>
                          {/* Upload Method Badge */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-medium">
                            {uploadMethod === "link" ? (
                              <>
                                <IconLink size={10} />
                                <span>Link</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  className="h-2.5 w-2.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="17 8 12 3 7 8" />
                                  <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span>Upload</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                          {/* Frame Count */}
                          {parsed.frameImages &&
                            Object.keys(parsed.frameImages).length > 0 && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="h-3 w-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect x="3" y="3" width="7" height="7" />
                                  <rect x="14" y="3" width="7" height="7" />
                                  <rect x="14" y="14" width="7" height="7" />
                                  <rect x="3" y="14" width="7" height="7" />
                                </svg>
                                {Object.keys(parsed.frameImages).length} frame
                                {Object.keys(parsed.frameImages).length !== 1
                                  ? "s"
                                  : ""}
                              </span>
                            )}

                          {/* File Type - Only for uploaded files */}
                          {uploadMethod === "file" && uploadedFile && (
                            <>
                              <span className="text-neutral-400">•</span>
                              <span className="flex items-center gap-1">
                                <svg
                                  className="h-3 w-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                                {uploadedFile.name
                                  .substring(uploadedFile.name.lastIndexOf("."))
                                  .toUpperCase()}
                              </span>
                              <span className="text-neutral-400">•</span>
                              <span>
                                {(uploadedFile.size / 1024).toFixed(2)} KB
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Parsed Status Badge */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-medium flex-shrink-0">
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Parsed</span>
                      </div>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className="flex-shrink-0 ml-4">
                      <svg
                        className={`h-5 w-5 text-neutral-500 transition-transform duration-200 ${
                          showParsedDetails ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Expandable Details Section */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      showParsedDetails
                        ? "max-h-[1000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="space-y-4">
                        {/* File Key */}
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
                            File Key
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowFullLink(!showFullLink)}
                              className="flex-1 font-mono text-xs text-neutral-700 dark:text-neutral-300 hover:text-[#ED5E20] transition-colors text-left break-all"
                              title="Click to toggle full file key"
                            >
                              {showFullLink
                                ? parsed.fileKey
                                : `${parsed.fileKey.slice(0, 40)}...`}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(parsed.fileKey);
                                toast.success("File key copied!");
                              }}
                              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                              title="Copy file key"
                            >
                              <svg
                                className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="2"
                                  ry="2"
                                />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                          </div>
                        </div>

                          {/* Uploaded Date */}
  {parsed?.uploadedAt && (
    <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span>
        Uploaded: {new Date(parsed.uploadedAt).toLocaleString()}
      </span>
    </div>
  )}

                        {/* File Details Grid - Only for uploaded files */}
                        {uploadMethod === "file" && uploadedFile && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* File Type */}
                            <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                              <label className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 block">
                                File Type
                              </label>
                              <div className="flex items-center gap-2">
                                {uploadedFile.name.endsWith(".fig") ? (
                                  <>
                                    <svg
                                      className="h-4 w-4 text-purple-600 dark:text-purple-400"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                      .fig File
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="h-4 w-4 text-purple-600 dark:text-purple-400"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                      />
                                      <circle cx="8.5" cy="8.5" r="1.5" />
                                      <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                      {uploadedFile.name
                                        .substring(
                                          uploadedFile.name.lastIndexOf(".")
                                        )
                                        .toUpperCase()}{" "}
                                      Image
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* File Size */}
                            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                              <label className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 block">
                                File Size
                              </label>
                              <div className="flex items-center gap-2">
                                <svg
                                  className="h-4 w-4 text-blue-600 dark:text-blue-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                  <polyline points="13 2 13 9 20 9" />
                                </svg>
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                  {(uploadedFile.size / 1024).toFixed(2)} KB
                                </span>
                              </div>
                            </div>

                            {/* Original Filename */}
                            <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
                              <label className="text-xs font-medium text-green-600 dark:text-green-400 mb-1 block">
                                Original Name
                              </label>
                              <div className="flex items-center gap-2">
                                <svg
                                  className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span
                                  className="text-sm font-semibold text-green-700 dark:text-green-300 truncate"
                                  title={uploadedFile.name}
                                >
                                  {uploadedFile.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Extraction Success Message for .fig files */}
                        {uploadMethod === "file" &&
                          uploadedFile?.name.endsWith(".fig") && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-start gap-3">
                                <svg
                                  className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <div>
                                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
                                    File Successfully Extracted
                                  </p>
                                  <p className="text-xs text-blue-700 dark:text-blue-300">
                                    {
                                      Object.keys(parsed.frameImages || {})
                                        .length
                                    }{" "}
                                    design frame(s) were automatically extracted
                                    from your .fig file and are ready for
                                    evaluation.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                        {uploadedFiles.length > 0 && (
                          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-green-900 dark:text-green-100 truncate">
                                {uploadedFiles[0].name}{" "}
                                {uploadedFiles.length > 1
                                  ? `+ ${uploadedFiles.length - 1} more`
                                  : ""}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                {(
                                  uploadedFiles.reduce(
                                    (s, f) => s + f.size,
                                    0
                                  ) / 1024
                                ).toFixed(2)}{" "}
                                KB total • Multiple images
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setUploadedFiles([]);
                                setUploadedFile(null);
                              }}
                              className="flex-shrink-0 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Remove files"
                            >
                              {/* X icon */}
                              <svg
                                className="h-5 w-5 text-red-600 dark:text-red-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between gap-4 pt-2">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
          border border-neutral-300/70 dark:border-neutral-600/60 
          bg-white/60 dark:bg-neutral-800/50
          text-neutral-700 dark:text-neutral-200
          shadow-sm backdrop-blur
          hover:bg-white/80 dark:hover:bg-neutral-800/70
          hover:border-neutral-400 dark:hover:border-neutral-500
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
          cursor-pointer"
                type="button"
              >
                <svg
                  className="h-4 w-4 opacity-80"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 17l-5-5 5-5" />
                </svg>
                Back
              </button>

              <div className="flex gap-3">
                {uploadMethod && (
                  <button
                    type="button"
                    onClick={handleParse}
                    disabled={!canParse && !uploadedFile}
                    className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center min-w-[120px] transition-all duration-200
              ${
                parsing
                  ? "text-white bg-gray-400 cursor-not-allowed"
                  : parsed
                  ? "border-2 border-[#ED5E20] text-[#ED5E20] bg-transparent hover:bg-[#ED5E20]/10 hover:shadow-lg hover:shadow-[#ED5E20]/20"
                  : "text-white bg-gradient-to-r from-[#ED5E20] to-orange-600 hover:from-orange-600 hover:to-[#ED5E20] hover:shadow-lg hover:shadow-[#ED5E20]/30"
              } ${
                      !canParse && !uploadedFile && !parsing
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {parsing ? (
                      <span className="flex items-center gap-2">
                        Parsing
                        <span className="inline-flex">
                          <span className="w-1.5 h-1.5 mx-0.5 bg-white rounded-full animate-bounce [animation-delay:-0.32s]"></span>
                          <span className="w-1.5 h-1.5 mx-0.5 bg-white rounded-full animate-bounce [animation-delay:-0.16s]"></span>
                          <span className="w-1.5 h-1.5 mx-0.5 bg-white rounded-full animate-bounce"></span>
                        </span>
                      </span>
                    ) : parsed ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                        Re-Parse
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                        Parse
                      </span>
                    )}
                  </button>
                )}

                {parsed && !parsing && (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={rateLimitCountdown !== null}
                    className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200
                  ${
                    rateLimitCountdown !== null
                      ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                      : "cursor-pointer text-white bg-gradient-to-r from-[#ED5E20] to-orange-600 hover:from-orange-600 hover:to-[#ED5E20] shadow-lg shadow-[#ED5E20]/30 hover:shadow-xl hover:shadow-[#ED5E20]/40"
                  }`}
                  >
                    {rateLimitCountdown !== null ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" opacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
                        </svg>
                        Wait {rateLimitCountdown}s
                      </>
                    ) : (
                      <>
                        Next
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M7 3l5 5-5 5" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && parsed && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <p className="text-lg font-bold uppercase text-[#ED5E20]">
                Review Information and Evaluate
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Carefully check the provided details and ensure all information
                is correct before proceeding.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-lg p-4 bg-accent dark:bg-neutral-800/60 border">
                <h3 className="text-[18px] font-semibold mb-3 p-3 text-center text-neutral-900 dark:text-neutral-100">
                  {parsed.name}
                </h3>

                {/* Show frame count */}
                {parsed.frameImages &&
                  Object.keys(parsed.frameImages).length > 0 && (
                    <div className="mb-3 flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      <span className="font-medium">
                        {Object.keys(parsed.frameImages).length} frame
                        {Object.keys(parsed.frameImages).length !== 1
                          ? "s"
                          : ""}{" "}
                        ready for evaluation
                      </span>
                    </div>
                  )}

                {/* Display frames */}
                {parsed.frameImages &&
                Object.keys(parsed.frameImages).length > 0 ? (
                  <>
                    <FrameCarousel frameImages={parsed.frameImages} />

                    {/* Debug info - remove in production */}
                    {/* <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Debug Info:
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Frame Keys: {Object.keys(parsed.frameImages).join(", ")}
                      </p>
                    </div> */}
                  </>
                ) : parsed.thumbnail ? (
                  <div className="thumbnail-wrapper mb-3">
                    <Image
                      src={parsed.thumbnail}
                      alt="Thumbnail preview"
                      width={320}
                      height={200}
                      className="rounded object-cover shadow-sm transition-transform hover:scale-105"
                    />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex items-center gap-2 text-sm italic",
                      "text-muted-foreground"
                    )}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Preview not available — let your imagination fill the gap.
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-lg p-4 bg-accent dark:bg-neutral-800/60 border">
                <h3 className="text-[18px] font-semibold mb-3 p-3 text-center text-neutral-900 dark:text-neutral-100">
                  Parameters
                </h3>
                <div className="flex justify-between gap-2 text-center">
                  {/* Generation Card */}
                  <div className="flex w-1/2 h-[50px] bg-[#ED5E20]/5 p-2 rounded-lg justify-center items-center gap-3">
                    <div className="flex items-center justify-center gap-2 text-base font-semibold text-[#ED5E20]">
                      {age && (
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      )}
                      <span>{age || "—"}</span>
                    </div>
                  </div>

                  {/* Occupation Card */}
                  <div className="flex w-1/2 h-[50px] bg-[#ED5E20]/5 p-2 rounded-lg justify-center items-center gap-3">
                    <div className="flex items-center justify-center gap-2 text-base font-semibold text-[#ED5E20]">
                      {occupation && (
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="2"
                            y="7"
                            width="20"
                            height="14"
                            rx="2"
                            ry="2"
                          />
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                        </svg>
                      )}
                      <span>{occupation || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium
                  border border-neutral-300/70 dark:border-neutral-600/60 
                  bg-white/60 dark:bg-neutral-800/50
                  text-neutral-700 dark:text-neutral-200
                  shadow-sm backdrop-blur
                  hover:bg-white/80 dark:hover:bg-neutral-800/70
                  hover:border-neutral-400 dark:hover:border-neutral-500
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                  focus:ring-offset-white dark:focus:ring- cursor-pointer"
              >
                <svg
                  className="h-4 w-4 opacity-80"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 17l-5-5 5-5" />
                </svg>
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium
                    border border-neutral-300/70 dark:border-neutral-600/60 
                    bg-white/60 dark:bg-neutral-800/50
                    text-neutral-700 dark:text-neutral-200
                    shadow-sm backdrop-blur
                    hover:bg-white/80 dark:hover:bg-neutral-800/70
                    hover:border-neutral-400 dark:hover:border-neutral-500
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                    focus:ring-offset-white dark:focus:ring- cursor-pointer"
                  type="button"
                >
                  <svg
                    className="h-4 w-4 opacity-80"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Pencil (edit) icon */}
                    <path d="M15.232 5.232l-10 10V17h1.768l10-10a2 2 0 0 0-2.828-2.828z" />
                    <path d="M17.414 2.586a2 2 0 0 1 0 2.828l-1.172 1.172-2.828-2.828 1.172-1.172a2 2 0 0 1 2.828 0z" />
                  </svg>
                  Edit Parameters
                </button>
                <button
                  disabled={submitting}
                  onClick={() => {
                    handleSubmit();
                  }}
                  className="group relative inline-flex items-center justify-center
                  px-9 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                  transition-all duration-300
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 cursor-pointer"
                >
                  {/* Glow / gradient base */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b] cursor-pointer"
                  />

                  {/* Inner glass layer */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px] cursor-pointer"
                  />
                  {/* Animated sheen */}
                  {!submitting && (
                    <span
                      aria-hidden="true"
                      className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                    >
                      <span className="absolute inset-y-0 -left-full w-1/2 translate-x-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                    </span>
                  )}
                  {/* Border ring */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50 cursor-pointer"
                  />
                  {/* Label */}
                  <span className="relative flex items-center gap-2 cursor-pointer">
                    Evaluate
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            {evalError ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <Image
                  src="/images/fetch-failed_1.png"
                  alt="Evaluation failed"
                  height={140}
                  width={180}
                  className="object-contain mb-4 opacity-90"
                  priority
                />
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                  Evaluation failed
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-md">
                  {evalError}
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
                  >
                    Back to Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#ED5E20] hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    Edit Upload
                  </button>
                </div>
              </div>
            ) : evaluatedFrames.length < expectedFrameCount ? (
              <div className="flex flex-col items-center justify-center text-center py-24">
                <div className="flex flex-col items-center justify-center text-center animate-pulse mb-6">
                  <Image
                    src="/images/smart-evaluation-underway.svg"
                    alt="Running evaluation illustration"
                    height={150}
                    width={150}
                    className="object-contain mb-6"
                    priority
                  />
                  <h2 className="gradient-text text-lg font-semibold mb-2">
                    Smart Evaluation Underway!
                  </h2>
                  <p className="text-gray-500 text-sm mb-4">
                    This may take a few minutes...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="text-center text-2xl font-bold text-[#ED5E20] mb-4">
                  🎉 All frames successfully evaluated!
                </div>
                <div className="text-center text-base text-gray-700 dark:text-gray-300 mt-2">
                  Design{" "}
                  <span className="font-mono text-[#ED5E20]">{savedDesignId}</span>{" "}
                  has been saved and evaluated.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
