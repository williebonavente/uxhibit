import React, { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { FrameEvaluation } from "../page";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  designId: string;
  currentVersionId: string;
  previousVersionId: string;
  onClose: () => void;
}

export const DesignComparison: React.FC<Props> = ({
  designId,
  currentVersionId,
  previousVersionId,
  onClose,
}) => {
  const [currentFrames, setCurrentFrames] = useState<FrameEvaluation[]>([]);
  const [previousFrames, setPreviousFrames] = useState<FrameEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [diffUrl, setDiffUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [threshold, setThreshold] = useState(40);
  const [swapSides, setSwapSides] = useState(false);
  const [versions, setVersions] = useState<
    { id: string; version: number; created_at: string }[]
  >([]);
  const [selectedCurrentVersionId, setSelectedCurrentVersionId] =
    useState(currentVersionId);
  const [selectedPreviousVersionId, setSelectedPreviousVersionId] =
    useState(previousVersionId);
  const [showVersionPopover, setShowVersionPopover] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [isFetchingFrames, setIsFetchingFrames] = useState(false);

  const previousVersionMeta = versions.find(
    (v) => v.id === selectedPreviousVersionId
  );
  const currentVersionMeta = versions.find(
    (v) => v.id === selectedCurrentVersionId
  );

  const previousLabel = previousVersionMeta
    ? `v${previousVersionMeta.version}`
    : "v?";

  const currentLabel = currentVersionMeta
    ? `v${currentVersionMeta.version}`
    : "v?";

  const areSequential =
    previousVersionMeta &&
    currentVersionMeta &&
    currentVersionMeta.version === previousVersionMeta.version + 1;

  // Optional fancy subtitle text
  const previousSubtitle = areSequential ? "Baseline" : "Reference";
  const displayOptionsRef = useRef<HTMLDivElement | null>(null);

  const supabase = createClient();

  const fetchFrames = useCallback(
    async (versionId: string) => {
      const { data, error } = await supabase
        .from("design_frame_evaluations")
        .select("id, node_id, thumbnail_url, ai_summary, ai_data, created_at")
        .eq("design_id", designId)
        .eq("version_id", versionId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Fetch frames error", error.message);
        return [];
      }
      return (data || []) as FrameEvaluation[];
    },
    [designId, supabase]
  );

  const buildDiff = useCallback(
    async (aUrl: string, bUrl: string) => {
      try {
        // ...existing code...
        const diff = ctx.createImageData(w, h);
        const thr = Math.max(0, Math.min(100, threshold));
        const thrMag = (thr / 100) * 441; // normalize to 0..441

        for (let i = 0; i < aData.data.length; i += 4) {
          const dr = aData.data[i] - bData.data[i];
          const dg = aData.data[i + 1] - bData.data[i + 1];
          const db = aData.data[i + 2] - bData.data[i + 2];
          const mag = Math.sqrt(dr * dr + dg * dg + db * db);
          if (mag > thrMag) {
            diff.data[i] = 255;
            diff.data[i + 1] = 0;
            diff.data[i + 2] = 0;
            diff.data[i + 3] = Math.min(200, (mag / 441) * 220 + 40);
          } else {
            diff.data[i] = 0;
            diff.data[i + 1] = 0;
            diff.data[i + 2] = 0;
            diff.data[i + 3] = 0;
          }
        }
        ctx.putImageData(diff, 0, 0);
        setDiffUrl(c.toDataURL("image/png"));
      } catch (e) {
        console.warn("Diff build failed", e);
        setDiffUrl(null);
      }
    },
    [threshold]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [cur, prev] = await Promise.all([
        fetchFrames(currentVersionId),
        fetchFrames(previousVersionId),
      ]);
      if (!active) return;
      setCurrentFrames(cur);
      setPreviousFrames(prev);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchFrames, currentVersionId, previousVersionId]);

  useEffect(() => {
    if (!showHeatmap) {
      setDiffUrl(null);
      return;
    }
    const cur = currentFrames[frameIndex];
    const prev =
      previousFrames.find((p) => p.node_id === cur?.node_id) ||
      previousFrames[frameIndex];
    if (!cur || !prev) {
      setDiffUrl(null);
      return;
    }
    // Keep diff consistent regardless of swapSides; swap only affects display
    buildDiff(prev.thumbnail_url, cur.thumbnail_url);
  }, [showHeatmap, frameIndex, currentFrames, previousFrames, buildDiff]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setFrameIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setFrameIndex((i) =>
          Math.min(
            Math.max(currentFrames.length, previousFrames.length) - 1,
            i + 1
          )
        );
      if (e.key.toLowerCase() === "h") setShowHeatmap((v) => !v);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentFrames.length, previousFrames.length, onClose]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("design_versions")
        .select("id, version, created_at")
        .eq("design_id", designId)
        .order("version", { ascending: false });
      if (error) {
        console.warn(
          "[DesignComparison] fetch versions failed:",
          error.message
        );
        return;
      }
      if (!active) return;
      setVersions((data || []) as any);
    })();
    return () => {
      active = false;
    };
  }, [designId, supabase]);

  // Load frames for the selected versions
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setFrameIndex(0);
      const [cur, prev] = await Promise.all([
        fetchFrames(selectedCurrentVersionId),
        fetchFrames(selectedPreviousVersionId),
      ]);
      if (!active) return;
      setCurrentFrames(cur);
      setPreviousFrames(prev);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchFrames, selectedCurrentVersionId, selectedPreviousVersionId]);

  // Prevent identical selection (optional guard)
  useEffect(() => {
    if (
      selectedCurrentVersionId === selectedPreviousVersionId &&
      versions.length > 1
    ) {
      // If the user matched them, auto-pick the next available for "previous"
      const alt = versions.find((v) => v.id !== selectedCurrentVersionId)?.id;
      if (alt) setSelectedPreviousVersionId(alt);
    }
  }, [selectedCurrentVersionId, selectedPreviousVersionId, versions]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setBootstrapping(true);
      const [cur, prev] = await Promise.all([
        fetchFrames(currentVersionId),
        fetchFrames(previousVersionId),
      ]);
      if (!active) return;
      setCurrentFrames(cur);
      setPreviousFrames(prev);
      setLoading(false);
      setBootstrapping(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchFrames, currentVersionId, previousVersionId]);

  // Load frames when user changes versions: no full-screen overlay
  useEffect(() => {
    let active = true;
    (async () => {
      setIsFetchingFrames(true);
      setFrameIndex(0);
      const [cur, prev] = await Promise.all([
        fetchFrames(selectedCurrentVersionId),
        fetchFrames(selectedPreviousVersionId),
      ]);
      if (!active) return;
      setCurrentFrames(cur);
      setPreviousFrames(prev);
      setIsFetchingFrames(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchFrames, selectedCurrentVersionId, selectedPreviousVersionId]);

  const maxFrames = Math.max(currentFrames.length, previousFrames.length);

  const aligned =
    currentFrames[frameIndex] &&
    previousFrames.find(
      (p) => p.node_id === currentFrames[frameIndex]?.node_id
    );

  return (
    <div className="fixed inset-0 z-[1000] w-screen h-screen bg-white dark:bg-[#121212] flex flex-col overscroll-contain">
      {bootstrapping && (
        <div className="flex flex-col items-center justify-center h-screen animate-pulse">
          <Image
            src="/images/loading-your-designs.svg"
            alt="Loading designs illustration"
            height={150}
            width={150}
            className="object-contain mb-6"
            priority
          />
          <p className="text-gray-500 text-sm mb-4">Loading designs...</p>
        </div>
      )}

      {!bootstrapping && (
        <>
          {/* Header */}
          <div className="mt-10 ml-12 mr-12 relative rounded-md border-b bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-[#181818] dark:via-[#1b1b1b] dark:to-[#181818] backdrop-blur-sm">
            {/* subtle top glow */}
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#ED5E20] to-transparent opacity-40" />
            <div className="flex items-center justify-between px-5 py-3">
              <div className="px-5 py-3 mb-4">
                <h2
                  id="version-comparison-title"
                  className="text-2xl sm:text-3xl font-bold gradient-text truncate"
                >
                  Version Comparison
                </h2>
              </div>

              {isFetchingFrames && (
                <div
                  className="hidden sm:flex items-center gap-2 text-xs px-2 py-1 rounded-full
               bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-700
               dark:from-[#29170f] dark:to-[#21120c] dark:border-orange-900/50 dark:text-orange-200 shadow-sm"
                  aria-live="polite"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="font-medium">Syncing frames…</span>
                  <span className="ml-1 inline-flex -space-x-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-[pulse_1.4s_ease-in-out_.2s_infinite]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-200 animate-[pulse_1.6s_ease-in-out_.4s_infinite]" />
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={150}>
                  <Card className="border-orange-200/40 dark:border-neutral-700/60 bg-white/70 dark:bg-neutral-800/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md shadow-sm mr-10">
                    <CardContent className="p-2">
                      <div
                        role="toolbar"
                        aria-label="Comparison controls"
                        className="flex items-center gap-2 flex-wrap"
                      >
                        {/* Prev */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer"
                              onClick={() =>
                                setFrameIndex((i) => Math.max(0, i - 1))
                              }
                              disabled={frameIndex === 0}
                              aria-label="Previous frame"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Previous (←)</TooltipContent>
                        </Tooltip>

                        {/* Frame counter */}
                        <div className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-neutral-700 tabular-nums">
                          {frameIndex + 1} / {maxFrames || 1}
                        </div>

                        {/* Next */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer"
                              onClick={() =>
                                setFrameIndex((i) =>
                                  Math.min(maxFrames - 1, i + 1)
                                )
                              }
                              disabled={frameIndex >= maxFrames - 1}
                              aria-label="Next frame"
                            >
                              <ChevronRight className="h-4 w-4 animate-[pulse_3s_ease-in-out_infinite]" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Next (→)</TooltipContent>
                        </Tooltip>

                        <Separator
                          orientation="vertical"
                          className="mx-1 h-6"
                        />

                        <Popover
                          modal
                          open={showVersionPopover}
                          onOpenChange={setShowVersionPopover}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs flex items-center gap-1 cursor-pointer"
                              aria-haspopup="dialog"
                            >
                              Version Picker
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            ref={displayOptionsRef}
                            side="bottom"
                            align="start"
                            className="z-[1100] w-[360px] p-3 space-y-4 overflow-visible"
                            onInteractOutside={(e) => {
                              const el = e.target as HTMLElement | null;
                              if (
                                el &&
                                (el.closest(".cmp-select-content") ||
                                  el.closest("[data-radix-select-content]"))
                              ) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <div className="text-base font-semibold mb-4">
                              Choose versions to compare
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Previous version picker */}
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium">
                                  Previous
                                </label>
                                <Select
                                  value={selectedPreviousVersionId}
                                  onValueChange={(v) =>
                                    setSelectedPreviousVersionId(v)
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Previous version" />
                                  </SelectTrigger>
                                  {/* Raise z-index and use popper positioning */}
                                  <SelectContent
                                    position="popper"
                                    className="z-[1200] cmp-select-content"
                                  >
                                    {versions.map((v) => (
                                      <SelectItem
                                        key={v.id}
                                        value={v.id}
                                        disabled={
                                          v.id === selectedCurrentVersionId
                                        }
                                      >
                                        {`v${v.version}`} • {v.id.slice(0, 6)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Current version picker */}
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium">
                                  Current
                                </label>
                                <Select
                                  value={selectedCurrentVersionId}
                                  onValueChange={(v) =>
                                    setSelectedCurrentVersionId(v)
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Current version" />
                                  </SelectTrigger>
                                  {/* Raise z-index and use popper positioning */}
                                  <SelectContent
                                    position="popper"
                                    className="z-[1200] cmp-select-content"
                                  >
                                    {versions.map((v) => (
                                      <SelectItem
                                        key={v.id}
                                        value={v.id}
                                        disabled={
                                          v.id === selectedPreviousVersionId
                                        }
                                      >
                                        {`v${v.version}`} • {v.id.slice(0, 6)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1 mt-8">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowVersionPopover(false)}
                                className="text-xs cursor-pointer"
                              >
                                Close
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="text-xs cursor-pointer"
                                onClick={() => setShowVersionPopover(false)}
                              >
                                Apply
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Display Options here */}

                        <Popover>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs flex items-center gap-1 cursor-pointer"
                                  aria-haspopup="dialog"
                                >
                                  Display Options
                                </Button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent className="z-[1100]">
                              Swap, heatmap, threshold
                            </TooltipContent>
                          </Tooltip>
                          <PopoverContent
                            side="bottom"
                            align="start"
                            className="z-[1100] w-[360px] p-3 space-y-4"
                          >
                            <div className="text-base font-semibold">
                              Display Options
                            </div>
                            <div className="space-y-3">
                              {/* Swap */}
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-gray-600 dark:text-gray-300">
                                  Swap sides
                                </span>
                                <Toggle
                                  pressed={swapSides}
                                  onPressedChange={() =>
                                    setSwapSides((s) => !s)
                                  }
                                  aria-label="Swap sides"
                                  className="h-7 px-2 data-[state=on]:bg-orange-100 dark:data-[state=on]:bg-[#ED5E20]/20"
                                >
                                  <ArrowLeftRight className="h-4 w-4 mr-1" />
                                  <span className="text-[11px]">Swap</span>
                                </Toggle>
                              </div>

                              <Separator />

                              {/* Jump to specific frames */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                    Jump to frame
                                  </span>
                                  <span className="text-[10px] tabular-nums px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-700">
                                    {frameIndex + 1}/{maxFrames || 1}
                                  </span>
                                </div>

                                <Select
                                  value={String(frameIndex)}
                                  onValueChange={(v) =>
                                    setFrameIndex(Number(v))
                                  }
                                >
                                  {/* Taller trigger to fit the 96x64 thumbnail */}
                                  <SelectTrigger className="h-16 min-h-16 w-full text-xs px-3 flex items-center gap-3">
                                    {(() => {
                                      const cur = currentFrames[frameIndex];
                                      const prev = previousFrames[frameIndex];
                                      const thumb =
                                        cur?.thumbnail_url ||
                                        prev?.thumbnail_url;
                                      return thumb ? (
                                        <Image
                                          src={thumb}
                                          alt={`Frame ${frameIndex + 1}`}
                                          width={96}
                                          height={64}
                                          className="h-16 w-24 rounded border object-cover bg-white dark:bg-neutral-900"
                                        />
                                      ) : (
                                        <div className="h-16 w-24 rounded border bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] text-gray-400">
                                          No img
                                        </div>
                                      );
                                    })()}
                                    <div className="flex flex-col justify-center min-w-0">
                                      <SelectValue placeholder="Select frame">
                                        <span className="text-xs font-medium">
                                          Frame {frameIndex + 1}
                                        </span>
                                      </SelectValue>
                                      {(() => {
                                        const cur = currentFrames[frameIndex];
                                        const prev = previousFrames[frameIndex];
                                        const isAligned =
                                          cur &&
                                          prev &&
                                          cur.node_id === prev.node_id;
                                        return (
                                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {isAligned
                                              ? "Aligned"
                                              : "Unmatched"}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </SelectTrigger>

                                  <SelectContent
                                    position="popper"
                                    align="start"
                                    sideOffset={6}
                                    // Match popover width
                                    style={{
                                      width:
                                        displayOptionsRef.current?.offsetWidth,
                                    }}
                                    className="cmp-select-content z-[1200] max-h-[520px] w-full bg-white dark:bg-neutral-800 shadow-lg border border-gray-200 dark:border-neutral-700 overflow-auto rounded-md"
                                  >
                                    <div className="py-1">
                                      {Array.from({ length: maxFrames }).map(
                                        (_, i) => {
                                          const cur = currentFrames[i];
                                          const prev = previousFrames[i];
                                          const thumb =
                                            cur?.thumbnail_url ||
                                            prev?.thumbnail_url;
                                          const isAligned =
                                            cur &&
                                            prev &&
                                            cur.node_id === prev.node_id;
                                          return (
                                            <SelectItem
                                              key={i}
                                              value={String(i)}
                                              className="px-2 py-2 min-h-[72px] data-[state=checked]:bg-orange-50 dark:data-[state=checked]:bg-neutral-700/60 rounded-sm"
                                            >
                                              <div className="flex items-center gap-4">
                                                {thumb ? (
                                                  <Image
                                                    src={thumb}
                                                    alt={`Frame ${i + 1}`}
                                                    width={96}
                                                    height={64}
                                                    className="h-16 w-24 rounded border object-cover bg-white dark:bg-neutral-900"
                                                  />
                                                ) : (
                                                  <div className="h-16 w-24 rounded border bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] text-gray-400">
                                                    No img
                                                  </div>
                                                )}
                                                <div className="min-w-0">
                                                  <div className="text-xs font-medium flex items-center gap-1">
                                                    Frame {i + 1}
                                                    {/* {isAligned && (
                                                      <span className="text-[9px] px-1 py-[1px] rounded bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30">
                                                        ✓
                                                      </span>
                                                    )} */}
                                                  </div>
                                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                    {isAligned
                                                      ? "Aligned"
                                                      : "Unmatched"}
                                                  </div>
                                                </div>
                                              </div>
                                            </SelectItem>
                                          );
                                        }
                                      )}
                                    </div>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Heatmap toggle */}
                              <div className="flex items-center justify-between mt-10">
                                <span className="text-[11px] text-gray-600 dark:text-gray-300">
                                  Heatmap
                                </span>
                                <Toggle
                                  pressed={showHeatmap}
                                  onPressedChange={() =>
                                    setShowHeatmap((v) => !v)
                                  }
                                  aria-label="Toggle heatmap"
                                  className="h-7 px-2 data-[state=on]:bg-orange-100 dark:data-[state=on]:bg-[#ED5E20]/20"
                                >
                                  <Flame
                                    className={`h-4 w-4 mr-1 ${
                                      showHeatmap ? "text-[#ED5E20]" : ""
                                    }`}
                                  />
                                  <span className="text-[11px]">On</span>
                                </Toggle>
                              </div>

                              {/* Threshold slider */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-gray-600 dark:text-gray-300">
                                    Threshold
                                  </span>
                                  <span className="text-[10px] tabular-nums px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-700">
                                    {threshold}
                                  </span>
                                </div>
                                <Slider
                                  value={[threshold]}
                                  onValueChange={([v]) => setThreshold(v)}
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="w-full"
                                  aria-label="Heatmap threshold"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs cursor-pointer"
                                onClick={() => {
                                  setSwapSides(false);
                                  setShowHeatmap(true);
                                  setThreshold(40);
                                }}
                              >
                                Reset
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="text-xs cursor-pointer"
                                onClick={() => {}}
                              >
                                Done
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Separator
                          orientation="vertical"
                          className="mx-1 h-6"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipProvider>
                {/* Close button row (bottom-right of header) */}
                <div className="flex justify-end pt-5 mr-4 mb-25">
                  <button
                    onClick={onClose}
                    aria-label="Close comparison"
                    className="p-1 rounded-full text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div
            className={`flex-1 px-12 py-4 min-h-0 overflow-auto ${
              isFetchingFrames ? "opacity-60" : ""
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {swapSides ? (
                <>
                  {/* Current (left when swapped) */}
                  <div className="relative border rounded-md p-4 bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="mb-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                              Current
                            </span>
                            <span
                              className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium
                              bg-indigo-100 text-indigo-700 dark:bg-[#1f2540] dark:text-indigo-200 border border-indigo-200/70 dark:border-indigo-900/40"
                            >
                              {currentLabel}
                            </span>
                          </h3>
                          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 tracking-wide">
                            Active version frame
                          </p>
                        </div>

                        {areSequential && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                            +1 iteration
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center px-2 py-1 rounded
                          bg-gray-100 dark:bg-neutral-800 text-[11px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700"
                        >
                          Frame {frameIndex + 1}
                        </span>
                        {aligned && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded
                            bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800"
                          >
                            ✓ Aligned
                          </span>
                        )}
                      </div>
                    </div>
                    {currentFrames[frameIndex] ? (
                      <div className="relative w-full flex items-center justify-center">
                        <Image
                          src={currentFrames[frameIndex].thumbnail_url}
                          alt="Current frame"
                          width={800}
                          height={800}
                          className="object-contain w-auto max-h-[calc(100vh-220px)] rounded"
                          priority
                        />
                        {showHeatmap && diffUrl && (
                          <Image
                            src={diffUrl}
                            alt="Heatmap"
                            aria-hidden
                            className="object-contain w-auto max-h-[calc(100vh-220px)] rounded"
                            style={{
                              imageRendering: "pixelated",
                              margin: "auto",
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No frame</div>
                    )}
                  </div>

                  {/* Previous (right when swapped) */}
                  <div className="relative border rounded-md p-4 bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="mb-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                              {previousSubtitle}
                            </span>
                            <span
                              className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium
                              bg-orange-100 text-orange-700 dark:bg-[#402610] dark:text-orange-200 border border-orange-200/70 dark:border-orange-900/40"
                            >
                              {previousLabel}
                            </span>
                          </h3>
                          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 tracking-wide">
                            Previous version frame
                          </p>
                        </div>

                        {/* (Optional) comparison badge
                        {currentVersionMeta && previousVersionMeta && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                              Comparing to
                            </span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800">
                              {currentLabel}
                            </span>
                          </div>
                        )} */}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center px-2 py-1 rounded
                          bg-gray-100 dark:bg-neutral-800 text-[11px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700"
                        >
                          Frame {frameIndex + 1}
                        </span>
                        {aligned && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded
                            bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800"
                          >
                            ✓ Aligned
                          </span>
                        )}
                      </div>
                    </div>
                    {previousFrames[frameIndex] ? (
                      <div className="relative w-full flex items-center justify-center">
                        <Image
                          src={previousFrames[frameIndex].thumbnail_url}
                          alt="Previous frame"
                          width={800}
                          height={800}
                          className="object-contain w-auto max-h-[65vh] rounded"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No frame</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Previous (left default) */}
                  <div className="relative border rounded-md p-4 bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="mb-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                              {previousSubtitle}
                            </span>
                            <span
                              className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium
                              bg-orange-100 text-orange-700 dark:bg-[#402610] dark:text-orange-200 border border-orange-200/70 dark:border-orange-900/40"
                            >
                              {previousLabel}
                            </span>
                          </h3>
                          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 tracking-wide">
                            Previous version frame
                          </p>
                        </div>

                        {/* (Optional) comparison badge */}
                        {/* {currentVersionMeta && previousVersionMeta && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                              Comparing to
                            </span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800">
                              {currentLabel}
                            </span>
                          </div>
                        )} */}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center px-2 py-1 rounded
                          bg-gray-100 dark:bg-neutral-800 text-[11px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700"
                        >
                          Frame {frameIndex + 1}
                        </span>
                        {aligned && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded
                            bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800"
                          >
                            ✓ Aligned
                          </span>
                        )}
                      </div>
                    </div>
                    {previousFrames[frameIndex] ? (
                      <div className="relative w-full flex items-center justify-center">
                        <Image
                          src={previousFrames[frameIndex].thumbnail_url}
                          alt="Previous frame"
                          width={800}
                          height={800}
                          className="object-contain w-auto max-h-[65vh] rounded"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="text-lg text-gray-400">No frame</div>
                    )}
                  </div>

                  {/* Current (right default) */}
                  <div className="relative border rounded-md p-4 bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="mb-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                              Current
                            </span>
                            <span
                              className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium
                              bg-indigo-100 text-indigo-700 dark:bg-[#1f2540] dark:text-indigo-200 border border-indigo-200/70 dark:border-indigo-900/40"
                            >
                              {currentLabel}
                            </span>
                          </h3>
                          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 tracking-wide">
                            Active version frame
                          </p>
                        </div>

                        {areSequential && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                            +1 iteration
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center px-2 py-1 rounded
                          bg-gray-100 dark:bg-neutral-800 text-[11px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700"
                        >
                          Frame {frameIndex + 1}
                        </span>
                        {aligned && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded
                            bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800"
                          >
                            ✓ Aligned
                          </span>
                        )}
                      </div>
                    </div>
                    {currentFrames[frameIndex] ? (
                      <div className="relative w-full flex items-center justify-center">
                        <Image
                          src={currentFrames[frameIndex].thumbnail_url}
                          alt="Current frame"
                          width={800}
                          height={800}
                          className="object-contain w-auto max-h-[65vh] rounded"
                          priority
                        />
                        {showHeatmap && diffUrl && (
                          <Image
                            src={diffUrl}
                            alt="Heatmap"
                            aria-hidden
                            className="pointer-events-none absolute inset-0 object-contain w-auto max-h-[65vh] mix-blend-screen"
                            style={{
                              imageRendering: "pixelated",
                              margin: "auto",
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No frame</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
