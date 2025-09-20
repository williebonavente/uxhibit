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
    <div 
      className="min-h-screen flex items-center justify-center"
      style={cardCursor}
    >
      <div
        className="relative z-10 p-6 md:p-10 flex flex-col gap-8"
        style={cardCursor}
      >
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-5 text-xs font-medium tracking-wide p-5 rounded-full"> 
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
                Select Target Audience's Generation & Occupation
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
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full
                              rounded-lg
                              bg-white dark:bg-neutral-800/70
                              text-sm font-md
                              text-neutral-900 dark:text-neutral-200
                              px-3 py-2
                              appearance-none
                              focus:outline-none
                              focus:ring-.5 focus:ring-[#ED5E20]
                              transition
                              hover:border-[#ED5E20]/50
                              cursor-pointer"
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
              </label>

              {/* Occupation */}
              <label className="group relative flex flex-col rounded-xl
                                bg-accent dark:bg-neutral-800/60
                                text-white
                                p-5
                                transition-colors 
                                focus-within:ring-1 focus-within:ring-[#ED5E20]/70 focus-within:border-[#ED5E20 border"
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
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="
                      w-full
                      rounded-lg
                      bg-white dark:bg-neutral-800/70
                      text-sm font-md
                      text-neutral-900 dark:text-neutral-200
                      px-3 py-2
                      appearance-none
                      focus:outline-none
                      focus:ring-.5 focus:ring-[#ED5E20]
                      transition
                      hover:border-[#ED5E20]/50
                      cursor-pointer"
                  >
                    <option value="" className="dark:text-neutral-500 dark:text-neutral-100">
                      Select Occupation
                    </option>
                    <option value="Student" className="text-neutral-700">Student</option>
                    <option value="Freelancer" className="text-neutral-700">Freelancer</option>
                    <option value="Designer" className="text-neutral-700">Designer</option>
                    <option value="Developer" className="text-neutral-700">Developer</option>
                    <option value="Educator" className="text-neutral-700">Educator</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 group-focus-within:text-[#ED5E20]">
                    ▾
                  </span>
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
                Make sure the file is only from figma.com domain and is public or shared with you.
              </p>
            </div>

            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.figma.com/design/..."
              className="w-full h-14 px-4 rounded-lg bg-accent dark:bg-neutral-800/60 text-sm focus:outline-none focus:ring-1 focus:ring-[#ED5E20]/50"
            />
            {parsed && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-accent dark:bg-neutral-800/60 border">
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
                  <div className="text-muted text-sm">No preview available</div>
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
                    setStep(4);
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
          <div className="space-y-5">
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