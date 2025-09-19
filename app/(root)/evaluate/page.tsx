"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { FrameCarousel } from "@/components/carousel/frame-carousel";

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
  // OPTIONAL darker stroke for dark mode via media query (inline workaround)
  const pointerCursorDark =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' stroke='%23ffffff' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3l7 17 2-7 7-2-16-8Z'/></svg>\") 2 2, pointer";
  const selectBase =
    "w-full appearance-none bg-transparent text-sm font-medium outline-none focus:outline-none cursor-pointer rounded-md transition-colors " +
    // Added a bit more left padding so option text isn’t tight against the icon
    "pl-2.5 pr-9 py-2.5 md:py-3 leading-tight";
  // ...existing buildSelectClass stays unchanged...

  const buildSelectClass = (hasValue: boolean) =>
    [
      selectBase,
      "text-neutral-900 dark:text-neutral-100",
      hasValue
        ? "bg-white/70 dark:bg-neutral-800 shadow-sm"
        : "bg-transparent hover:bg-white/55 dark:hover:bg-neutral-800/55",
      "border border-transparent hover:border-neutral-300/70 dark:hover:border-neutral-600/70",
      "focus:border-[#ED5E20]/70 focus:ring-2 focus:ring-[#ED5E20]/40 dark:focus:border-[#ED5E20]/70",
      "focus:bg-white/85 dark:focus:bg-neutral-800/85",
      hasValue
        ? "hover:bg-white/80 dark:hover:bg-neutral-800/80"
        : "placeholder:text-neutral-500 dark:placeholder:text-neutral-400",
      "backdrop-blur-sm",
    ].join(" ");
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const supabase = createClient();

  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [link, setLink] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedMeta | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canNextFrom1 = !!age && !!occupation;
  const canParse = !!link && !parsing;

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

      if (data) {
        // console.log("Extracted metadata from Figma parse:", data.normalizedFrames);
        console.log("There is data", { data });
        // console.log("Extracted text nodes from Figma parse", data.textNodes);
        // console.log("Extracted contrast evaluation score parse: ", data.accessbilityScores)
        // console.log("Extracted random sheesh", data.accessibilityResults);
      } else {
        console.log("No metadata found in Figma parse response.");
      }

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
    if (!parsed) {
      toast.error("No parsed design");
      return;
    }
    if (!age || !occupation) {
      toast.error("Parameters missing");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Sign in required.");
      return;
    }

    const frameEntries = Object.entries(parsed.frameImages || {});
    if (frameEntries.length === 0) {
      toast.error("No frames found in parsed design.");
      return;
    }

    setSubmitting(true);
    // const loadingToast = toast.loading("Running AI evaluation...");
    try {
      // Save the design and let the backend handle evaluation
      const saveRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/designs`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
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
      const saved = await saveRes.json();
      console.log(saved);
      // toast.dismiss(loadingToast);

      if (!saveRes.ok || !saved?.design?.id) {
        toast.error(saved?.error || "Save failed");
        return;
      }
      // Check backend evaluation result
      if (saved.ai_evaluation && saved.ai_evaluation.frameCount > 0) {
        toast.success("Design and AI evaluation completed for all frames");
      } else {
        toast.warning("Design saved, but AI evaluation did not complete.");
      }

      router.push(`/designs/${saved.design.id}`);
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Submit failed");
      // toast.dismiss(loadingToast);
    } finally {
      setSubmitting(false);
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
    <div className="relative min-h-screen flex items-center justify-center rounded-2xl overflow-hidden mt-5">
      {/* Orange gradient background */}
      <div
        className="absolute inset-0 w-full h-full orange-gradient-bg opacity-45"
        style={{
          zIndex: 0,
          background:
            "linear-gradient(135deg, #ffb347 0%, #ed5e20 60%, #f97316 100%)",
        }}
      >
        <style>
          {`
            @media (prefers-color-scheme: dark) {
              .orange-gradient-bg {
                background: linear-gradient(135deg, #ed5e20 0%, #f59e0b 60%, #ffb347 100%);
              }
            }
          `}
        </style>
      </div>

      {/* CHANGED: layered glass overlays for readability (lighter in light mode, subtle in dark) */}
      <div className="absolute inset-0">
        {/* base blur + tint */}
        <div className="absolute inset-0 backdrop-blur-md bg-white/35 dark:bg-black/40 " />
        {/* gradient to increase contrast behind center content */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/20 dark:from-black/60 dark:via-black/50 dark:to-black/40 rounded-2xl" />
        {/* slight inner ring for glass edge definition */}
        <div className="absolute inset-0 ring-1 ring-white/40 dark:ring-white/10 pointer-events-none" />
      </div>

      <div
        className="relative z-10 p-6 md:p-10 flex flex-col gap-8"
        style={cardCursor}
      >
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 text-xs font-medium tracking-wide">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`flex items-center gap-2`}>
              <span
                className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px]
                ${step === n
                    ? "bg-[#ED5E20] text-white"
                    : "bg-white/70 dark:bg-black/40 text-neutral-600 dark:text-neutral-300"
                  }`}
              >
                {n}
              </span>
              <span
                className={`hidden sm:inline ${step === n
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400"
                  }`}
              >
                {n === 1 && "Parameters"}
                {n === 2 && "Upload"}
                {n === 3 && "Review"}
                {n === 4 && "AI Evaluation"}
              </span>
              {n < 4 && (
                <div className="h-px w-10 bg-gradient-to-r from-transparent via-neutral-300/60 dark:via-neutral-600/50 to-transparent" />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <p className="text-sm md:text-base font-medium tracking-wide">
                Select audience parameters first.
              </p>
              <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                These guide how the evaluation is framed.
              </p>
            </div>

            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Generation */}
              <label className="group relative flex flex-col gap-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 bg-white/55 dark:bg-neutral-900/60 backdrop-blur-sm p-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors focus-within:ring-2 focus-within:ring-[#ED5E20]/60 focus-within:border-[#ED5E20]">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Generation
                </span>
                <div className="relative flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-[#ED5E20] opacity-80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3l4 4-4 4" />
                    <path d="M8 17l-4-4 4-4" />
                    <path d="M8 17h8l4-4" />
                  </svg>
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={buildSelectClass(!!age)}
                  >
                    <option value="">Select Generation</option>
                    <option value="Gen Z">Gen Z (1997-2012)</option>
                    <option value="Millennial">Millennial (1981-1996)</option>
                    <option value="Gen Alpha">
                      Gen Alpha (2013-Present)
                    </option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 group-focus-within:text-[#ED5E20]">
                    ▾
                  </span>
                </div>
                {!age && (
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    Choose target cohort
                  </span>
                )}
              </label>

              {/* Occupation */}
              <label className="group relative flex flex-col gap-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 bg-white/55 dark:bg-neutral-900/60 backdrop-blur-sm p-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors focus-within:ring-2 focus-within:ring-[#ED5E20]/60 focus-within:border-[#ED5E20]">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Occupation
                </span>
                <div className="relative flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-[#ED5E20] opacity-80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 12l8-4-8-4-8 4 8 4z" />
                    <path d="M4 12l8 4 8-4" />
                    <path d="M4 16l8 4 8-4" />
                  </svg>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className={buildSelectClass(!!occupation)}
                  >
                    <option value="">Select Occupation</option>
                    <option value="Student">Student</option>
                    <option value="Freelancer">Freelancer</option>
                    <option value="Designer">Designer</option>
                    <option value="Developer">Developer</option>
                    <option value="Educator">Educator</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 group-focus-within:text-[#ED5E20]">
                    ▾
                  </span>
                </div>
                {!occupation && (
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    Select target role
                  </span>
                )}
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
          <div className="space-y-6">
            <p className="text-center text-sm md:text-base">
              Paste your Figma link and preview.
            </p>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.figma.com/design/..."
              className="w-full h-14 px-4 rounded-lg border bg-white dark:bg-neutral-900 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#ED5E20]"
            />
            {parsed && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/70 dark:bg-neutral-800/60">
                {parsed.thumbnail && (
                  <Image
                    src={parsed.thumbnail}
                    alt="thumb"
                    width={64}
                    height={48}
                    className="rounded object-cover"
                  />
                )}
                <div className="text-xs md:text-sm">
                  <div className="font-semibold">{parsed.name}</div>
                  <div className="opacity-70 break-all">{parsed.fileKey}</div>
                </div>
              </div>
            )}
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
                  className={`px-6 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer
                    ${canParse
                      ? "bg-[#ED5E20] hover:bg-orange-600"
                      : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                  {parsing ? "Parsing..." : parsed ? "Re-Parse" : "Parse"}
                </button>
                {/*
                <button
                  disabled={!parsed}
                  onClick={() => parsed && setStep(3)}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer
                    ${parsed
                      ? "bg-[#ED5E20] hover:bg-orange-600"
                      : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                  Review
                </button>
                */}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && parsed && (
          <div className="space-y-6">
            <p className="text-center text-sm md:text-base">
              Review and submit.
            </p>
            <div className="grid gap-4">
              <div className="rounded-lg p-4 border bg-white/70 dark:bg-neutral-800/60">
                <h3 className="font-semibold text-sm mb-2">Parameters</h3>
                <p className="text-xs md:text-sm">
                  Generation: <span className="font-medium">{age}</span>
                </p>
                <p className="text-xs md:text-sm">
                  Occupation:{" "}
                  <span className="font-medium">{occupation}</span>
                </p>
              </div>
              <div className="rounded-lg p-4 border bg-white/70 dark:bg-neutral-800/60">
                <h3 className="font-semibold text-sm mb-2">Design</h3>

                {parsed.frameImages && Object.keys(parsed.frameImages).length > 0 ? (
                  <FrameCarousel frameImages={parsed.frameImages} />
                ) : (
                  parsed.thumbnail && (
                    <Image
                      src={parsed.thumbnail}
                      alt="thumb"
                      width={320}
                      height={200}
                      className="rounded mb-3 object-cover"
                    />
                  )
                )}
                <p className="text-xs md:text-sm font-medium">
                  {parsed.name}
                </p>
                <p className="text-[11px] opacity-70 break-all">
                  File Key: {parsed.fileKey}
                </p>
                {parsed.nodeId && (
                  <p className="text-[11px] opacity-70 break-all">
                    Node: {parsed.nodeId}
                  </p>
                )}
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
                    setStep(4);
                  }}
                  className="group relative inline-flex items-center justify-center
                  px-9 py-2.5 rounded-xl text-sm font-semibold tracking-wide
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
                  <span className="relative z-10 flex items-center gap-2 cursor-pointer">
                    Evaluate
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Running AI Evaluation */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center text-center py-24 animate-pulse">
              <Image
                src="/images/smart-evaluation-underway.svg"
                alt="Running evaluation illustration"
                height={150}
                width={150}
                className="object-contain mb-6"
                priority
              />
              <h2 className="text-lg font-semibold text-[#ED5E20] mb-2">
                Smart Evaluation Underway!
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                This may take a few minutes...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}