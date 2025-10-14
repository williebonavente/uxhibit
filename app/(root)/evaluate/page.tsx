"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { FrameCarousel } from "@/components/carousel/frame-carousel";
import { IconLink } from "@tabler/icons-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
};

export default function Evaluate() {

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

  const canNextFrom1 = !!age && !!occupation;
  const canParse = !!link && !parsing;

  const progress = expectedFrameCount > 0
    ? Math.round((evaluatedFrames.length / expectedFrameCount) * 100)
    : 0;

  async function handleParse() {
    if (!age || !occupation) {
      toast.error("Select parameters first.");
      return;
    }
    if (!link.trim()) {
      toast.error("Enter a Figma link.");
      return;
    }
    setParsing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/figma/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Parse failed");
        return;
      }
      setParsed({
        fileKey: data.fileKey,
        nodeId: data.nodeId,
        name: data.name || "Untitled",
        thumbnail: data.nodeImageUrl || data.thumbnailUrl || null,
        frameImages: data.frameImages || {},
        type: data.type,
      });
      toast.success("Design parsed");
      setStep(3);
    } catch {
      toast.error("Network error");
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
      toast.error("No frames found in parsed design.");
      setStep(2);
      return;
    }

    setExpectedFrameCount(frameEntries.length);
    setStep(4); // Show progress bar UI

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

      const saveRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/designs`, {
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
      });
      console.log("[handleSubmit] Save response status", saveRes.status);

      const saved = await saveRes.json();
      console.log("[handleSubmit] Save response data", saved);

      if (!saveRes.ok || !saved?.design?.id) {
        console.log("[handleSubmit] Save failed", saved?.error);
        toast.error(saved?.error || "Save failed");
        return;
      }

      setSavedDesignId(saved.design.id);
      console.log("[handleSubmit] Saved design ID", saved.design.id);

      let pollCount = 0;
      let frames: EvalResponse[] = [];
      while (pollCount < 60) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        console.log(`[handleSubmit] Polling evaluation (attempt ${pollCount + 1}) for design ID: ${saved.design.id}`);
        const res = await fetch(`${baseUrl}/api/designs/${saved.design.id}/evaluations?ts=${Date.now()}`);
        console.log(`[handleSubmit] Evaluation response status: ${res.status}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.log("[handleSubmit] Failed to fetch evaluation results", errorData);
          toast.error("Failed to fetch evaluation results.");
          break;
        }

        const data = await res.json();
        console.log(`[handleSubmit] Evaluation response data:`, data);
        const expectedIds = Object.keys(parsed.frameImages || {});
        console.log("Raw results: ", data.results);
        console.log("Expected frame IDs: ", expectedIds);
        frames = (data.results || []).filter((f: any) =>
          expectedIds.includes(f.nodeId || f.node_id)
        );
        console.log(`[handleSubmit] Evaluated frames count: ${frames.length} / ${expectedIds.length}`, frames);

        setEvaluatedFrames(frames);

        if (frames.length === expectedIds.length) {
          console.log("[handleSubmit] All frames evaluated, redirecting...");
          toast.success("Design and AI evaluation completed for all frames");
          router.push(`/designs/${saved.design.id}`);
          return;
        }

        await new Promise(res => setTimeout(res, 2000));
        pollCount++;
      }

      // After timeout, redirect anyway
      if (frames.length < frameEntries.length) {
        console.log("[handleSubmit] Timeout: Not all frames evaluated", {
          framesEvaluated: frames.length,
          expected: frameEntries.length,
        });
        toast.warning("Design saved, but AI evaluation did not complete.");
        router.push(`/designs/${saved.design.id}`);
      }

    } catch (error) {
      console.error("[handleSubmit] Submit failed:", error);
      toast.error("Submit failed");
    } finally {
      setSubmitting(false);
      console.log("[handleSubmit] Finished");
    }
  }

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
      <div className="relative pt-2 md:pt-4 pb-6 md:pb-8 flex flex-col gap-8" style={cardCursor}>
        {/* Step Indicator */}

        <div className="flex items-center justify-center gap-5 text-xs font-medium tracking-wide p-2 rounded-full mt-0">
          {[1, 2, 3, 4].map((n, i) => (
            <div key={n} className="flex items-center gap-3">
              {/* Step Circle */}
              <span
                className={`relative h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all
            ${step === n
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
                className={`hidden sm:inline text-sm ${step >= n
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
              ${step > n
                      ? "bg-[#ED5E20]"
                      : "bg-neutral-300 dark:bg-neutral-700"
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
              <label className="group relative flex flex-col rounded-xl
                                bg-accent dark:bg-neutral-800/60
                                text-white
                                p-5
                                transition-colors
                                focus-within:ring-1 focus-within:ring-[#ED5E20]/70 focus-within:border-[#ED5E20 border"
                style={cardCursor}>
                <span className="text-[15px] font-semibold text-[#ED5E20] mb-2">
                  Generation
                </span>
                {!age && (
                  <span className="text-[13px] text-neutral-700 dark:text-neutral-500 dark:text-neutral-100 mb-5">
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
                      <SelectItem value="Millennial">Millennial (1981-1996)</SelectItem>
                      <SelectItem value="Gen Alpha">Gen Alpha (2013-Present)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </label>

              {/* Occupation */}
              <label className="group relative flex flex-col rounded-xl
                                bg-accent dark:bg-neutral-800/60 text-white
                                p-5 transition-colors focus-within:ring-1 focus-within:ring-[#ED5E20]/70 focus-within:border-[#ED5E20 border"
                style={cardCursor}>
                <span className="text-[15px] font-semibold text-[#ED5E20] mb-2">
                  Occupation
                </span>
                {!occupation && (
                  <span className="text-[13px] text-neutral-700 dark:text-neutral-500 dark:text-neutral-100 mb-5">
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
                    ${canNextFrom1
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
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <p className="text-lg font-bold uppercase text-[#ED5E20]">
                Paste Figma Design Link
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Make sure the link is only from figma.com domain and is public or shared with you.
              </p>
            </div>

            {/* Search Bar */}
            <div className="sticky top-0 bg-white/80 dark:bg-[#1A1A1A] backdrop-blur-md rounded-xl shadow px-4 py-2 w-full mx-auto">
              <div className="flex items-center gap-3">
                <IconLink size={20} className="text-[#ED5E20]" />
                <Input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://www.figma.com/design/..."
                  className="w-full h-14 px-4 rounded-lg bg-accent/10 dark:bg-neutral-800/60 text-sm focus:outline-none focus:ring-1 focus:ring-[#ED5E20]/50"
                />
              </div>
              {parsed && (
                <div className="px-6 py-6"> {/* Increased margin-top and padding */}
                  {/* Info Section: Name and FileKey */}
                  <div className="mb-6 p-5 rounded-lg bg-accent dark:bg-neutral-800/60 border">
                    <div className="font-bold text-2xl md:text-xl mb-1">{parsed.name}</div>
                    <div className="opacity-70 break-all text-sm md:text-base">{parsed.fileKey}</div>
                  </div>
                  {/* Thumbnail Section */}
                  {parsed.thumbnail && (
                    <div className="flex justify-center">
                      <Image
                        src={parsed.thumbnail}
                        alt="thumb"
                        width={700}
                        height={700}
                        className="rounded object-cover shadow-2xl w-full max-w-[700px] h-auto"
                        priority
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between gap-4">
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
                  <path d="M13 17l-5-5 5-5" />
                </svg>
                Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!canParse}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold flex items-center justify-center min-w-[120px]
                    ${parsing
                      ? "text-white bg-gray-400 cursor-not-allowed"
                      : parsed
                        ? "border-2 border-[#ED5E20] text-[#ED5E20] bg-transparent hover:bg-[#ED5E20]/10"
                        : "text-white bg-[#ED5E20] hover:bg-orange-600"
                    } transition-colors cursor-pointer`}
                >
                  {parsing ? (
                    <span className="flex items-center gap-1">
                      Parsing
                      <span className="inline-flex">
                        <span className="w-1.5 h-1.5 mx-0.5 bg-white rounded-full animate-bounce [animation-delay:-0.32s]"></span>
                        <span className="w-1.5 h-1.5 mx-0.5 bg-white rounded-full animate-bounce [animation-delay:-0.16s]"></span>
                        <span className="w-1.5 h-1.5 mx-0.5 bg-white rounded-full animate-bounce"></span>
                      </span>
                    </span>
                  ) : parsed ? "Re-Parse" : "Parse"}
                </button>
                {parsed && !parsing && (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="cursor-pointer px-6 py-2 rounded-lg text-sm font-semibold text-white bg-[#ED5E20] hover:bg-orange-600 transition-colors"
                  >
                    Next
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
                Carefully check the provided details and ensure all information is correct before proceeding.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-lg p-4 bg-accent dark:bg-neutral-800/60 border">
                <h3 className="text-[18px] font-semibold mb-3 p-3 text-center text-neutral-900 dark:text-neutral-100">{parsed.name}</h3>
                {parsed.frameImages && Object.keys(parsed.frameImages).length > 0 ? (
                  <FrameCarousel frameImages={parsed.frameImages} />
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
                  <div className={cn(
                    "flex items-center gap-2 text-sm italic",
                    "text-muted-foreground"
                  )}>
                    <AlertCircle className="h-4 w-4" />
                    <span>Preview not available — let your imagination fill the gap.</span>
                  </div>


                )}
              </div>
            </div>

            <div className="rounded-lg p-4 bg-accent dark:bg-neutral-800/60 border">
              <h3 className="text-[18px] font-semibold mb-3 p-3 text-center text-neutral-900 dark:text-neutral-100">Parameters</h3>
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
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                      </svg>
                    )}
                    <span>{occupation || "—"}</span>
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
                    // setStep(4);
                  }}
                  className="group relative inline-flex items-center justify-center
                  px-9 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                  transition-all duration-300
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 cursor pointer"
                >
                  {/* Glow / gradient base */}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b] cursor-pointer"
                  />

                  {/* Inner glass layer */}
                  <span
                    aria-hidden
                    className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px] cursor-pointer"
                  />
                  {/* Animated sheen */}
                  {!submitting && (
                    <span
                      aria-hidden
                      className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                    >
                      <span className="absolute inset-y-0 -left-full w-1/2 translate-x-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                    </span>
                  )}
                  {/* Border ring */}
                  <span
                    aria-hidden
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
            <h2 className="text-lg font-semibold mb-4">Evaluated Frames</h2>
            {evaluatedFrames.length < expectedFrameCount ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Image
                  src="/images/smart-evaluation-underway.svg"
                  alt="Running evaluation illustration"
                  height={120}
                  width={120}
                  className="object-contain mb-4"
                  priority
                />
                <div className="w-full max-w-md mb-4">
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-4 bg-gradient-to-r from-orange-400 to-[#ED5E20] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-center text-sm mt-2 text-gray-600">
                    {evaluatedFrames.length} / {expectedFrameCount} frames evaluated
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-2">
                  AI evaluation in progress. Please wait...
                </p>
              </div>
            ) : (
              <ul>
                {evaluatedFrames.map((frame, idx) => (
                  <li key={`${frame.nodeId ?? 'frame'}-${idx}`}>
                    Frame {idx + 1}: {frame.ai?.summary || "No summary"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {savedDesignId && (
        <div className="mt-4 text-sm text-gray-500">
          Design ID: <span className="font-mono">{savedDesignId}</span>
        </div>
      )}
    </div>
  );
}