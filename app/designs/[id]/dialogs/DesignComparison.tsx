import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import NextImage from "next/image";
import { createClient } from "@/utils/supabase/client";
import { EvalResponse, FrameEvaluation } from "../page";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
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
import pixelmatch from "pixelmatch";

interface Props {
  designId: string;
  currentVersionId: string;
  previousVersionId: string;
  onClose: () => void;
}

type HeatColor = "cyan" | "magenta" | "lime" | "red";

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
    {
      id: string;
      version: number;
      created_at: string;
      ai_data?: EvalResponse;
    }[]
  >([]);
  const [selectedCurrentVersionId, setSelectedCurrentVersionId] =
    useState(currentVersionId);
  const [selectedPreviousVersionId, setSelectedPreviousVersionId] =
    useState(previousVersionId);
  const [showVersionPopover, setShowVersionPopover] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [isFetchingFrames, setIsFetchingFrames] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [revealPct, setRevealPct] = useState(50);
  const [blink, setBlink] = useState(false);
  const [blinkSpeed, setBlinkSpeed] = useState(400);
  const [blinkShowCurrent, setBlinkShowCurrent] = useState(true);
  const [displayOptionsOpen, setDisplayOptionsOpen] = useState(false);
  const [diffCount, setDiffCount] = useState<number | null>(null);
  const [heatmapColor, setHeatmapColor] = useState<HeatColor>("lime");
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(200);
  const HEATMAP_RGB = useMemo<Record<HeatColor, [number, number, number]>>(
    () => ({
      cyan: [0, 229, 255],
      magenta: [255, 0, 170],
      lime: [132, 204, 22],
      red: [239, 68, 68],
    }),
    []
  );

  const HEATMAP_LABELS: Record<HeatColor, string> = {
    cyan: "Cyan",
    magenta: "Magenta",
    lime: "Lime",
    red: "Red",
  };

  const previousVersionMeta = versions.find(
    (v) => v.id === selectedPreviousVersionId
  );
  const currentVersionMeta = versions.find(
    (v) => v.id === selectedCurrentVersionId
  );

  const previousVersionScore = useMemo(
    () => computeScore(previousVersionMeta?.ai_data),
    [previousVersionMeta]
  );
  const currentVersionScore = useMemo(
    () => computeScore(currentVersionMeta?.ai_data),
    [currentVersionMeta]
  );

  // Per-frame scores aligned by node_id when possible
  const currentFrame = currentFrames[frameIndex];
  const alignedPrevFrame =
    previousFrames.find((p) => p.node_id === currentFrame?.node_id) ||
    previousFrames[frameIndex];

  const currentScore = useMemo(
    () => computeScore(currentFrame?.ai_data),
    [currentFrame]
  );
  const previousScore = useMemo(
    () => computeScore(alignedPrevFrame?.ai_data),
    [alignedPrevFrame]
  );
  const scoreDelta =
    typeof currentScore === "number" && typeof previousScore === "number"
      ? currentScore - previousScore
      : undefined;

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
      // 1) Fetch rows for a version
      const { data, error } = await supabase
        .from("design_frame_evaluations")
        .select("id, node_id, thumbnail_url, ai_summary, ai_data, created_at")
        .eq("design_id", designId)
        .eq("version_id", versionId)
        .order("node_id", { ascending: true }) // stable order by node_id
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Fetch frames error", error.message, { versionId });
        return [];
      }

      const rows = (data || []) as FrameEvaluation[];

      // 2) Dedupe by node_id: keep the latest created_at for each node_id
      const byNode = new Map<string, FrameEvaluation>();
      for (const r of rows) {
        const key = String(r.node_id || "");
        const prev = byNode.get(key);
        if (!prev) byNode.set(key, r);
        else if (new Date(r.created_at).getTime() > new Date(prev.created_at).getTime()) {
          byNode.set(key, r);
        }
      }

      let frames = Array.from(byNode.values());

      // 3) Ensure thumbnails are usable: drop empties
      frames = frames.filter(
        (f) => typeof f.thumbnail_url === "string" && f.thumbnail_url.length > 0
      );

      console.log("[DesignComparison] Fetched frames", {
        versionId,
        total: rows.length,
        deduped: frames.length,
        uniqueNodeIds: frames.map((f) => f.node_id),
      });

      return frames;
    },
    [designId, supabase]
  );

    const fetchAlignedPair = useCallback(
    async (curVersionId: string, prevVersionId: string) => {
      const [cur, prev] = await Promise.all([
        fetchFrames(curVersionId),
        fetchFrames(prevVersionId),
      ]);

      const prevSet = new Set(prev.map((p) => String(p.node_id)));
      const curAligned = cur.filter((c) => prevSet.has(String(c.node_id)));

      // Keep prev aligned to the same node_ids and sort both by node_id
      const curSorted = [...curAligned].sort((a, b) =>
        String(a.node_id).localeCompare(String(b.node_id))
      );
      const prevMap = new Map(prev.map((p) => [String(p.node_id), p]));
      const prevAligned = curSorted
        .map((c) => prevMap.get(String(c.node_id)))
        .filter(Boolean) as FrameEvaluation[];

      return { cur: curSorted, prev: prevAligned };
    },
    [fetchFrames]
  );


  function drawContain(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    W: number,
    H: number
  ) {
    ctx.clearRect(0, 0, W, H);
    const scale = Math.min(W / img.width, H / img.height);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const x = Math.floor((W - w) / 2);
    const y = Math.floor((H - h) / 2);
    ctx.drawImage(img, x, y, w, h);
  }

  const buildDiff = useCallback(
    async (aUrl: string, bUrl: string) => {
      if (!aUrl || !bUrl) {
        console.warn("[buildDiff] Missing URLs", { aUrl, bUrl });
        setDiffUrl(null);
        setDiffCount(null);
        return;
      }
      try {
        const loadImg = (src: string) =>
          new Promise<HTMLImageElement>((res, rej) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => res(img);
            img.onerror = (e) => rej(e);
            img.src = src;
          });

        const [aImg, bImg] = await Promise.all([loadImg(aUrl), loadImg(bUrl)]);
        const W = Math.max(aImg.width, bImg.width);
        const H = Math.max(aImg.height, bImg.height);

        const cA = document.createElement("canvas");
        const cB = document.createElement("canvas");
        const cD = document.createElement("canvas");
        cA.width = cB.width = cD.width = W;
        cA.height = cB.height = cD.height = H;

        const ctxA = cA.getContext("2d")!;
        const ctxB = cB.getContext("2d")!;
        const ctxD = cD.getContext("2d")!;

        // 1) Compose onto white backgrounds, using contain BEFORE reading imageData
        ctxA.save();
        ctxA.fillStyle = "#ffffff";
        ctxA.fillRect(0, 0, W, H);
        drawContain(ctxA, aImg, W, H);
        ctxA.restore();

        ctxB.save();
        ctxB.fillStyle = "#ffffff";
        ctxB.fillRect(0, 0, W, H);
        drawContain(ctxB, bImg, W, H);
        ctxB.restore();

        // 2) Now read pixels
        const imgA = ctxA.getImageData(0, 0, W, H);
        const imgB = ctxB.getImageData(0, 0, W, H);
        const diff = ctxD.createImageData(W, H);

        // 3) Binary mask from pixelmatch (no AA)
        const thr = Math.max(0, Math.min(1, threshold / 100));
        const mismatches = pixelmatch(imgA.data, imgB.data, diff.data, W, H, {
          threshold: thr,
          includeAA: false,
          diffMask: true, // ensures mask output (white diffs, black matches)
        });

        if (!mismatches) {
          setDiffCount(0);
          setDiffUrl(null);
          return;
        }
        setDiffCount(mismatches);
        for (let i = 0; i < diff.data.length; i += 4) {
          const isDiff =
            (diff.data[i] | diff.data[i + 1] | diff.data[i + 2]) !== 0;
          if (isDiff) {
            const [r, g, b] = HEATMAP_RGB[heatmapColor];
            diff.data[i] = r;
            diff.data[i + 1] = g;
            diff.data[i + 2] = b;
            diff.data[i + 3] = Math.max(0, Math.min(255, heatmapOpacity));
          } else {
            diff.data[i] = 0;
            diff.data[i + 1] = 0;
            diff.data[i + 2] = 0;
            diff.data[i + 3] = 0;
          }
        }

        ctxD.putImageData(diff, 0, 0);
        setDiffUrl(cD.toDataURL("image/png"));
      } catch (err) {
        console.error("[buildDiff] pixelmatch error", err);
        setDiffUrl(null);
        setDiffCount(null);
      }
    },
    [threshold, heatmapColor, heatmapOpacity, HEATMAP_RGB]
  );

  function computeScore(aiData: any): number | undefined {
    if (!aiData) return undefined;

    const possible = (aiData as any)?.ai ?? aiData;
    const root = possible || {};
    const debugCalc = root?.debug_calc;

    // Heuristic average
    const heurAvg =
      typeof debugCalc?.heuristics_avg === "number"
        ? debugCalc.heuristics_avg
        : undefined;

    // Category scores can be array or object
    const catScoresObj =
      (root as any)?.ai?.category_scores ??
      (root as any)?.category_scores ??
      undefined;

    const catNumbers = Array.isArray(catScoresObj)
      ? (catScoresObj as number[]).filter((n) => Number.isFinite(n))
      : catScoresObj && typeof catScoresObj === "object"
      ? Object.values(catScoresObj).filter(
          (v: any): v is number => typeof v === "number" && Number.isFinite(v)
        )
      : [];

    const catAvg =
      catNumbers.length > 0
        ? Math.round(
            catNumbers.reduce((sum, n) => sum + n, 0) / catNumbers.length
          )
        : undefined;

    // BiasWeighted Average
    const biasWeighted =
      typeof debugCalc?.bias_weighted_overall === "number"
        ? debugCalc.bias_weighted_overall
        : typeof (root as any)?.bias?.weighted_overall === "number"
        ? (root as any).bias.weighted_overall
        : undefined;

    // Fallbacks (category + heuristic breakdown or overall_score)
    const fallbackFromData = (() => {
      const cats = root?.category_scores;
      let catsAvg: number | undefined;
      if (cats && typeof cats === "object") {
        const vals = Object.values(cats).filter(
          (v: any): v is number => typeof v === "number" && Number.isFinite(v)
        );
        if (vals.length)
          catsAvg = Math.round(
            vals.reduce((a: number, b: number) => a + b, 0) / vals.length
          );
      }
      const hb: any[] = Array.isArray(root?.heuristic_breakdown)
        ? root.heuristic_breakdown
        : [];
      let heuristicAvg: number | undefined;
      if (hb.length) {
        const pctSum = hb.reduce((acc, h) => {
          const s = typeof h.score === "number" ? h.score : 0;
          const m =
            typeof h.max_points === "number" && h.max_points > 0
              ? h.max_points
              : 4;
          return acc + (s / m) * 100;
        }, 0);
        heuristicAvg = Math.round(pctSum / hb.length);
      }
      if (typeof debugCalc?.final === "number") return debugCalc.final;
      if (typeof root?.overall_score === "number") return root.overall_score;
      if (typeof catsAvg === "number" && typeof heuristicAvg === "number")
        return Math.round((catsAvg + heuristicAvg) / 2);
      if (typeof catsAvg === "number") return catsAvg;
      if (typeof heuristicAvg === "number") return heuristicAvg;
      return undefined;
    })();

    const customTriAverage =
      typeof heurAvg === "number" &&
      typeof catAvg === "number" &&
      typeof biasWeighted === "number"
        ? Math.round((heurAvg + catAvg + biasWeighted) / 3)
        : undefined;

    const score =
      typeof customTriAverage === "number"
        ? customTriAverage
        : typeof debugCalc?.final === "number"
        ? debugCalc.final
        : fallbackFromData;

    return typeof score === "number" ? score : undefined;
  }


  function HeatmapOverlay({ src }: { src: string }) {
    return (
      <NextImage
        src={src}
        alt="Heatmap"
        aria-hidden
        fill
        unoptimized
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="pointer-events-none absolute inset-0 z-10 object-contain"
        style={{
          imageRendering: "pixelated",
          margin: "auto",
          mixBlendMode: "normal", // use normal so PNG alpha shows only diff pixels
          opacity: 1, // control overall intensity here if needed
        }}
      />
    );
  }

  function ScoreBadge({
    score,
    tone,
    title = "Overall score",
  }: {
    score: number;
    tone: "current" | "previous";
    title?: string;
  }) {
    const isCurrent = tone === "current";
    const toneClasses = isCurrent
      ? "from-indigo-500/15 to-violet-500/15 border-indigo-300/60 dark:border-indigo-900/50 ring-indigo-500/30"
      : "from-orange-500/15 to-amber-500/15 border-orange-300/60 dark:border-orange-900/50 ring-orange-500/30";

    const numberColor = isCurrent
      ? "text-indigo-700 dark:text-indigo-200"
      : "text-orange-700 dark:text-amber-200";

    return (
      <span
        className={`inline-flex items-baseline gap-2 px-3 py-1.5 rounded-md border bg-gradient-to-r shadow-sm ring-1 ${toneClasses}`}
        aria-label={title}
        title={title}
      >
        <span className="text-[10px] uppercase tracking-wide text-gray-600 dark:text-gray-300">
          Score
        </span>
        <span
          className={`tabular-nums text-base sm:text-lg font-bold ${numberColor}`}
        >
          {score}
        </span>
      </span>
    );
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("design_versions")
        .select("id, version, created_at, ai_data")
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
    buildDiff(prev.thumbnail_url, cur.thumbnail_url);
  }, [
    showHeatmap,
    frameIndex,
    currentFrames,
    previousFrames,
    buildDiff,
    heatmapColor,
    heatmapOpacity,
  ]);

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
      setIsFetchingFrames(true);
      setFrameIndex(0);
      const { cur, prev } = await fetchAlignedPair(
        selectedCurrentVersionId,
        selectedPreviousVersionId
      );
      if (!active) return;
      setCurrentFrames(cur);
      setPreviousFrames(prev);
      setIsFetchingFrames(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchAlignedPair, selectedCurrentVersionId, selectedPreviousVersionId]);

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

  useEffect(() => {
    if (!blink) return;
    const id = setInterval(
      () => setBlinkShowCurrent((s) => !s),
      Math.max(100, blinkSpeed)
    );
    return () => clearInterval(id);
  }, [blink, blinkSpeed]);

  const maxFrames = Math.max(currentFrames.length, previousFrames.length);

  const aligned =
    currentFrames[frameIndex] &&
    previousFrames.find(
      (p) => p.node_id === currentFrames[frameIndex]?.node_id
    );

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
      console.log("[DesignComparison] bootstrap counts", {
        currentVersionId,
        prevVersionId: previousVersionId,
        curCount: cur.length,
        prevCount: prev.length,
      });
    })();
    return () => {
      active = false;
    };
  }, [fetchFrames, currentVersionId, previousVersionId]);

  // If arrays have different lengths or misaligned node_ids, keep index within available range
  useEffect(() => {
    const max = Math.max(currentFrames.length, previousFrames.length);
    if (frameIndex >= max && max > 0) setFrameIndex(max - 1);
  }, [currentFrames.length, previousFrames.length, frameIndex]);


  return (
    <div className="fixed inset-0 z-[1000] w-screen h-screen bg-white dark:bg-[#121212] flex flex-col overscroll-contain">
      {bootstrapping && (
        <div className="flex flex-col items-center justify-center h-screen animate-pulse">
          <NextImage
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
                        <Popover
                          open={displayOptionsOpen}
                          onOpenChange={setDisplayOptionsOpen}
                        >
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
                                        <NextImage
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
                                                  <NextImage
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
                              {/* Split compare */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-gray-600 dark:text-gray-300">
                                    Split compare
                                  </span>
                                  <Toggle
                                    pressed={splitView}
                                    onPressedChange={(v) => setSplitView(v)}
                                    aria-label="Toggle split compare"
                                    className="h-7 px-2 data-[state=on]:bg-orange-100 dark:data-[state=on]:bg-[#ED5E20]/20"
                                  >
                                    <ArrowLeftRight className="h-4 w-4 mr-1" />
                                    <span className="text-[11px]">On</span>
                                  </Toggle>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-600 dark:text-gray-300">
                                      Reveal
                                    </span>
                                    <span className="text-[10px] tabular-nums px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-700">
                                      {revealPct}%
                                    </span>
                                  </div>
                                  <Slider
                                    value={[revealPct]}
                                    onValueChange={([v]) => setRevealPct(v)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                    aria-label="Split reveal"
                                  />
                                </div>
                              </div>

                              <Separator />

                              {/* Blink compare */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-gray-600 dark:text-gray-300">
                                    Blink compare
                                  </span>
                                  <Toggle
                                    pressed={blink}
                                    onPressedChange={(v) => setBlink(v)}
                                    aria-label="Toggle blink compare"
                                    className="h-7 px-2 data-[state=on]:bg-orange-100 dark:data-[state=on]:bg-[#ED5E20]/20"
                                  >
                                    <Sparkles className="h-4 w-4 mr-1" />
                                    <span className="text-[11px]">On</span>
                                  </Toggle>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-600 dark:text-gray-300">
                                      Blink speed (ms)
                                    </span>
                                    <span className="text-[10px] tabular-nums px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-700">
                                      {blinkSpeed}
                                    </span>
                                  </div>
                                  <Slider
                                    value={[blinkSpeed]}
                                    onValueChange={([v]) => setBlinkSpeed(v)}
                                    min={100}
                                    max={1200}
                                    step={50}
                                    className="w-full"
                                    aria-label="Blink speed"
                                  />
                                </div>
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

                                  <span className="text-[11px]">
                                    {showHeatmap ? "Off" : "On"}
                                  </span>
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

                              <Separator />
                              {/* Heatmap color */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-gray-600 dark:text-gray-300">
                                    Heatmap color
                                  </span>
                                  <div className="inline-flex items-center gap-2">
                                    <span
                                      className="inline-block w-4 h-4 rounded border"
                                      style={{
                                        backgroundColor: `rgb(${HEATMAP_RGB[
                                          heatmapColor
                                        ].join(",")})`,
                                      }}
                                      aria-hidden
                                    />
                                  </div>
                                </div>
                                <Select
                                  value={heatmapColor}
                                  onValueChange={(v) =>
                                    setHeatmapColor(v as HeatColor)
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Color" />
                                  </SelectTrigger>
                                  <SelectContent
                                    position="popper"
                                    className="z-[1200] cmp-select-content"
                                  >
                                    <SelectItem value="cyan">Cyan</SelectItem>
                                    <SelectItem value="magenta">
                                      Magenta
                                    </SelectItem>
                                    <SelectItem value="lime">Lime</SelectItem>
                                    <SelectItem value="red">Red</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Intensity */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-gray-600 dark:text-gray-300">
                                    Intensity
                                  </span>
                                  <span className="text-[10px] tabular-nums px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-700">
                                    {heatmapOpacity}
                                  </span>
                                </div>
                                <Slider
                                  value={[heatmapOpacity]}
                                  onValueChange={([v]) => setHeatmapOpacity(v)}
                                  min={60}
                                  max={255}
                                  step={5}
                                  className="w-full"
                                  aria-label="Heatmap intensity"
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
                                  setHeatmapColor("lime");
                                  setHeatmapOpacity(200);
                                }}
                              >
                                Reset
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="text-xs cursor-pointer"
                                onClick={() => setDisplayOptionsOpen(false)}
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
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                            +1 iteration
                            
                          </span>
                        )}
                        {typeof scoreDelta === "number" && (
  <span
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border ring-1 shadow-sm
      ${
        scoreDelta > 0
          ? "bg-green-50 dark:bg-green-900/25 text-green-700 dark:text-green-200 border-green-300 dark:border-green-800 ring-green-200/60 dark:ring-green-700/40"
          : scoreDelta < 0
          ? "bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-200 border-red-300 dark:border-red-800 ring-red-200/60 dark:ring-red-700/40"
          : "bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-200 border-amber-300 dark:border-amber-800 ring-amber-200/60 dark:ring-amber-700/40"
      }`}
    title={scoreDelta > 0 ? "Improved" : scoreDelta < 0 ? "Regressed" : "No change"}
  >
    {scoreDelta > 0 ? (
      <TrendingUp className="h-5 w-5" />
    ) : scoreDelta < 0 ? (
      <TrendingDown className="h-5 w-5" />
    ) : (
      <Minus className="h-5 w-5" />
    )}
    <span className="tabular-nums text-sm font-semibold">
      {scoreDelta > 0 ? "+" : scoreDelta < 0 ? "" : "±"}
      {scoreDelta}
    </span>
  </span>
)}
                         {typeof currentScore === "number" && (
                          <ScoreBadge score={currentScore} tone="current" />
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
                        {/* {typeof currentScore === "number" && (
                          <ScoreBadge score={currentScore} tone="current" />
                        )} */}
                      </div>
                    </div>
                    {currentFrames[frameIndex] ? (
                      <div className="relative w-full flex items-center justify-center">
                        {(() => {
                          const cur = currentFrames[frameIndex];
                          const alignedPrev =
                            previousFrames.find(
                              (p) => p.node_id === cur?.node_id
                            ) || previousFrames[frameIndex];

                          // Blink mode
                          if (blink && alignedPrev) {
                            const img = blinkShowCurrent
                              ? cur.thumbnail_url
                              : alignedPrev.thumbnail_url;
                            return (
                              <div className="relative">
                                <NextImage
                                  src={img}
                                  alt="Blink compare"
                                  width={800}
                                  height={800}
                                  className="object-contain w-auto max-h-[65vh] rounded"
                                  priority
                                />
                                {showHeatmap && diffUrl && (
                                  <HeatmapOverlay src={diffUrl} />
                                )}
                              </div>
                            );
                          }

                          // Split mode
                          if (splitView && alignedPrev) {
                            return (
                              <div className="relative w-full flex items-center justify-center">
                                <NextImage
                                  src={alignedPrev.thumbnail_url}
                                  alt="Previous (base)"
                                  width={800}
                                  height={800}
                                  className="object-contain w-auto max-h-[65vh] rounded"
                                  priority
                                />
                                <div
                                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                  style={{
                                    clipPath: `inset(0 ${
                                      100 - revealPct
                                    }% 0 0)`,
                                  }}
                                >
                                  <NextImage
                                    src={cur.thumbnail_url}
                                    alt="Current (revealed)"
                                    width={800}
                                    height={800}
                                    className="object-contain w-auto max-h-[65vh] rounded"
                                    priority
                                  />
                                </div>
                                {showHeatmap && diffUrl && (
                                  <HeatmapOverlay src={diffUrl} />
                                )}
                              </div>
                            );
                          }

                          // Default
                          return (
                            <div className="relative">
                              <NextImage
                                src={cur.thumbnail_url}
                                alt="Current frame"
                                width={800}
                                height={800}
                                className="object-contain w-auto max-h-[65vh] rounded"
                                priority
                              />

                              {showHeatmap && (
                                <div className="absolute top-2 right-2 z-20 text-[10px] px-2 py-1 rounded bg-black/60 text-white">
                                  {diffCount === null
                                    ? "Building…"
                                    : diffCount === 0
                                    ? "No differences"
                                    : `${diffCount} diffs`}
                                </div>
                              )}

                              {showHeatmap && diffUrl && (
                                <HeatmapOverlay src={diffUrl} />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No frame</div>
                    )}
                    {/* {showHeatmap && diffUrl && <HeatmapOverlay src={diffUrl} />} */}
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
                          {/* {areSequential && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                            +1 iteration
                            
                          </span>
                        )} */}
                         {typeof previousScore === "number" && (
                          <ScoreBadge score={previousScore} tone="previous" />
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
                    {previousFrames[frameIndex] ? (
                      <div className="relative w-full flex items-center justify-center">
                        <NextImage
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
                          {/* {areSequential && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                            +1 iteration
                            
                          </span>
                        )} */}
                         {typeof previousScore === "number" && (
                          <ScoreBadge score={previousScore} tone="previous" />
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
                    {previousFrames[frameIndex] ? (
                      <div className="relative w-full flex items-center justify-center">
                        <NextImage
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
                        {typeof scoreDelta === "number" && (
  <span
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border ring-1 shadow-sm
      ${
        scoreDelta > 0
          ? "bg-green-50 dark:bg-green-900/25 text-green-700 dark:text-green-200 border-green-300 dark:border-green-800 ring-green-200/60 dark:ring-green-700/40"
          : scoreDelta < 0
          ? "bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-200 border-red-300 dark:border-red-800 ring-red-200/60 dark:ring-red-700/40"
          : "bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-200 border-amber-300 dark:border-amber-800 ring-amber-200/60 dark:ring-amber-700/40"
      }`}
    title={scoreDelta > 0 ? "Improved" : scoreDelta < 0 ? "Regressed" : "No change"}
  >
    {scoreDelta > 0 ? (
      <TrendingUp className="h-5 w-5" />
    ) : scoreDelta < 0 ? (
      <TrendingDown className="h-5 w-5" />
    ) : (
      <Minus className="h-5 w-5" />
    )}
    <span className="tabular-nums text-sm font-semibold">
      {scoreDelta > 0 ? "+" : scoreDelta < 0 ? "" : "±"}
      {scoreDelta}
    </span>
  </span>
)}
                         {typeof currentScore === "number" && (
                          <ScoreBadge score={currentScore} tone="current" />
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
                        {/* {typeof currentScore === "number" && (
                          <ScoreBadge score={currentScore} tone="current" />
                        )} */}
                      </div>
                    </div>
                    {currentFrames[frameIndex] ? (
                      <div className="relative w-full flex items-center justify-center">
                        {(() => {
                          const cur = currentFrames[frameIndex];
                          const alignedPrev =
                            previousFrames.find(
                              (p) => p.node_id === cur?.node_id
                            ) || previousFrames[frameIndex];

                          // Blink mode
                          if (blink && alignedPrev) {
                            const img = blinkShowCurrent
                              ? cur.thumbnail_url
                              : alignedPrev.thumbnail_url;
                            return (
                              <div className="relative">
                                <NextImage
                                  src={img}
                                  alt="Blink compare"
                                  width={800}
                                  height={800}
                                  className="object-contain w-auto max-h-[65vh] rounded"
                                  priority
                                />
                                {showHeatmap && diffUrl && (
                                  <HeatmapOverlay src={diffUrl} />
                                )}
                              </div>
                            );
                          }

                          // Split mode
                          if (splitView && alignedPrev) {
                            return (
                              <div className="relative w-full flex items-center justify-center">
                                <NextImage
                                  src={alignedPrev.thumbnail_url}
                                  alt="Previous (base)"
                                  width={800}
                                  height={800}
                                  className="object-contain w-auto max-h-[65vh] rounded"
                                  priority
                                />
                                <div
                                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                  style={{
                                    clipPath: `inset(0 ${
                                      100 - revealPct
                                    }% 0 0)`,
                                  }}
                                >
                                  <NextImage
                                    src={cur.thumbnail_url}
                                    alt="Current (revealed)"
                                    width={800}
                                    height={800}
                                    className="object-contain w-auto max-h-[65vh] rounded"
                                    priority
                                  />
                                </div>
                                {showHeatmap && diffUrl && (
                                  <HeatmapOverlay src={diffUrl} />
                                )}
                              </div>
                            );
                          }

                          // Default
                          return (
                            <div className="relative">
                              <NextImage
                                src={cur.thumbnail_url}
                                alt="Current frame"
                                width={800}
                                height={800}
                                className="object-contain w-auto max-h-[65vh] rounded"
                                priority
                              />

                              {showHeatmap && (
                                <div className="absolute top-2 right-2 z-20 text-[10px] px-2 py-1 rounded bg-black/60 text-white">
                                  {diffCount === null
                                    ? "Building…"
                                    : diffCount === 0
                                    ? "No differences"
                                    : `${diffCount} diffs`}
                                </div>
                              )}

                              {showHeatmap && diffUrl && (
                                <HeatmapOverlay src={diffUrl} />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No frame</div>
                    )}
                    {/* {showHeatmap && diffUrl && <HeatmapOverlay src={diffUrl} />} */}
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
