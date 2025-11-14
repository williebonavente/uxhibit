import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings2, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface HeuristicLegendModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  items: {
    code?: string;
    title?: string;
    description?: string;
    category?: string;
    severity?: string | number;
    score?: number;
    max_points?: number;
    justification?: string;
  }[];
  versionLabel: number | string | null;
}

const HeuristicLegendModal: React.FC<HeuristicLegendModalProps> = ({
  open,
  onClose,
  loading,
  items,
  versionLabel,
}) => {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-10">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-7xl max-h-[80vh] overflow-y-auto bg-white dark:bg-[#1A1A1A] border rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text truncate">
            Heuristic Performance Overview{" "}
            {versionLabel != null && `(v${versionLabel})`}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-full text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        {loading ? (
          <div className="py-20 flex items-center justify-center text-[#ED5E20] font-semibold">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No heuristic entries found.
          </div>
        ) : (
          <>
            {/* Scoring Legend */}
            <div className="mb-8 rounded-lg border-2 border-[#ED5E20]/40 bg-white/70 dark:bg-[#232323]/70 p-6">
              <h3 className="text-xl font-bold dark:text-[#fafafa]  text-[#0b0b0b] mb-4 tracking-wide">
                Scoring Legend
              </h3>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5 text-base">
                {/* --- 0 --- */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 font-semibold text-lg">
                    0
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">
                    Missing
                  </span>
                </div>

                {/* --- 1 --- */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-semibold text-lg">
                    1
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm">
                    Poor
                  </span>
                </div>

                {/* --- 2 --- */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-semibold text-lg">
                    2
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm">
                    Adequate
                  </span>
                </div>

                {/* --- 3 --- */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-lg">
                    3
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm">
                    Good
                  </span>
                </div>

                {/* --- 4 --- */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold text-lg">
                    4
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm">
                    Excellent
                  </span>
                </div>
              </div>

              <div className="mt-8 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Each heuristic&apos;s bar shows current score relative to its
                maximum points. Use this to track which principles need
                attention in future improvements.
              </div>
            </div>

            {/* Radar Chart (overall heuristic distribution) */}
            <div className="mb-8 rounded-lg border border-[#ED5E20]/30 bg-white/60 dark:bg-[#232323]/60 p-4">
              <h2 className="text-xl font-bold dark:text-[#fafafa] text-[#0b0b0b] mb-3">
                Heuristic Principle Scores
              </h2>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Hover a node or badge to inspect. Click a badge to pin.
                </div>
                <RadarSettings /> {/* optional external hook */}
              </div>
              <RadarChart items={items} />
              <p className="mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                Visual overview of relative performance across heuristic
                principles.
              </p>
            </div>
            <ul className="space-y-4">
              {items.map((h, i) => {
                const score = typeof h.score === "number" ? h.score : undefined;
                const max =
                  typeof h.max_points === "number"
                    ? h.max_points
                    : score != null
                    ? 4
                    : undefined;
                const pct =
                  score != null && max
                    ? Math.min(100, Math.round((score / max) * 100))
                    : null;
                const barColor =
                  pct == null
                    ? "bg-gray-400"
                    : pct <= 25
                    ? "bg-red-500"
                    : pct <= 60
                    ? "bg-yellow-500"
                    : pct <= 85
                    ? "bg-blue-500"
                    : "bg-green-500";
                return (
                  <li
                    key={`${h.code}-${i}`}
                    className="p-4 rounded-lg border border-[#ED5E20]/25 bg-white/50 dark:bg-[#232323]/60 hover:border-[#ED5E20] transition"
                  >
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="px-2 py-1 text-xs font-bold rounded bg-gradient-to-r from-[#ED5E20] to-orange-400 text-white shadow">
                        {h.code || "CODE"}
                      </span>
                      {/* {h.category && (
                        <span className="px-2 py-1 text-xs rounded bg-[#ED5E20]/10 text-[#ED5E20] font-semibold">
                          {h.category}
                        </span>
                      )} */}
                      {h.severity != null && (
                        <span className="px-2 py-1 text-xs rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-semibold">
                          Severity: {h.severity}
                        </span>
                      )}
                      {score != null && max != null && (
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold">
                          Score: {score}/{max}
                        </span>
                      )}

                    </div>
                    <div className="font-semibold mb-1">
                      {h.title || "Untitled heuristic"}
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                      {h.description || "No description provided."}
                    </p>
                      <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
                      {/* TODO: later add the justification here */}
                      {/* {h.justification || "Justfied."} */}
                    </p>
                    {pct != null && (
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                          <span>{pct}%</span>
                          <span>
                            {pct === 100
                              ? "Excellent"
                              : pct >= 75
                              ? "Good"
                              : pct >= 50
                              ? "Adequate"
                              : pct >= 25
                              ? "Poor"
                              : "Missing"}{" "}
                          </span>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

const RadarSettings: React.FC<{ onChange?: (v: any) => void }> = ({
  onChange,
}) => {
  const [animate, setAnimate] = useState(false);
  const [percentMode, setPercentMode] = useState(false);
  const [opacity, setOpacity] = useState<number[]>([45]);
  const [showGridLabels, setShowGridLabels] = useState(false);
  const [showPercentValues, setShowPercentValues] = useState(true);
  const [showCenterBadge, setShowCenterBadge] = useState(false);

  // helper to emit to both the optional callback and window event bus
  const emit = React.useCallback(
    (vals: any) => {
      try {
        onChange?.(vals);
      } catch {}
      window.dispatchEvent(new CustomEvent("radar-settings", { detail: vals }));
    },
    [onChange]
  );

  useEffect(() => {
    emit({
      animate,
      percentMode,
      opacity: opacity[0],
      showGridLabels,
      showPercentValues,
      showCenterBadge,
    });
  }, [
    animate,
    percentMode,
    opacity,
    emit,
    showGridLabels,
    showPercentValues,
    showCenterBadge,
  ]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
        >
          <Settings2 size={14} /> Radar Settings
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-4" side="top" align="end">
        <div className="flex items-center justify-between">
          <Label htmlFor="radar-animate" className="text-xs">
            Animate
          </Label>
          <Switch
            id="radar-animate"
            checked={animate}
            onCheckedChange={setAnimate}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="radar-percent" className="text-xs">
            % Mode
          </Label>
          <Switch
            id="radar-percent"
            checked={percentMode}
            onCheckedChange={setPercentMode}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="radar-showgrid" className="text-xs">
            Grid Labels
          </Label>
          <Switch
            id="radar-showgrid"
            checked={showGridLabels}
            onCheckedChange={setShowGridLabels}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="radar-centerbadge" className="text-xs">
            Center Label
          </Label>
          <Switch
            id="radar-centerbadge"
            checked={showCenterBadge}
            onCheckedChange={setShowCenterBadge}
          />
        </div>
        <div>
          <Label className="text-xs">Fill Opacity ({opacity[0]}%)</Label>
          <Slider
            value={opacity}
            onValueChange={setOpacity}
            max={80}
            min={10}
            step={5}
            className="mt-2"
          />
        </div>
        <div className="text-[10px] text-gray-500 dark:text-gray-400">
          % Mode normalizes each score to 0 - 100 even if max differs.
        </div>
      </PopoverContent>
    </Popover>
  );
};

const RadarChart: React.FC<{ items: any[] }> = ({ items }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const [animate, setAnimate] = useState(false);
  const [percentMode, setPercentMode] = useState(false);
  const [fillOpacity, setFillOpacity] = useState(45);
  const [showGridLabels, setShowGridLabels] = useState(false);
  const [showPercentValues, setShowPercentValues] = useState(true);
  const [showCenterBadge, setShowCenterBadge] = useState(false);

  // Respect OS motion setting
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const canAnimate = animate && !reducedMotion;

  // Simple event bus via window (RadarSettings wrote console only; optionally wire real state)
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.animate != null) setAnimate(e.detail.animate);
      if (e.detail?.percentMode != null) setPercentMode(e.detail.percentMode);
      if (e.detail?.opacity != null) setFillOpacity(e.detail.opacity);
      if (e.detail?.showGridLabels != null)
        setShowGridLabels(e.detail.showGridLabels);
      if (e.detail?.showPercentValues != null)
        setShowPercentValues(e.detail.showPercentValues);
      if (e.detail?.showCenterBadge != null)
        setShowCenterBadge(e.detail.showCenterBadge);
    };
    window.addEventListener("radar-settings", handler as any);
    return () => window.removeEventListener("radar-settings", handler as any);
  }, []);

  const filtered = items
    .map((i) => ({
      ...i,
      score: Number((i as any).score),
      max_points: Number((i as any).max_points ?? 4),
    }))
    .filter((i) => Number.isFinite(i.score) && Number.isFinite(i.max_points))
    .slice(0, 14); // allow a few more

  if (!filtered.length) {
    return (
      <div className="text-xs text-gray-500">
        No scored heuristics for radar.
      </div>
    );
  }

  // Derived stats
  const maxScale = Math.max(4, ...filtered.map((h) => h.max_points || 4));
  const avgRatio =
    filtered.reduce(
      (acc, h) =>
        acc + h.score / (percentMode ? h.max_points || maxScale : maxScale),
      0
    ) / filtered.length;

  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 44;
  const levels = 5;

  const colorFor = (idx: number) =>
    `hsl(${Math.round((idx / filtered.length) * 360)} 80% 50%)`;

  const points = filtered.map((h, idx) => {
    const angle = (Math.PI * 2 * idx) / filtered.length - Math.PI / 2;
    const ratio = percentMode
      ? h.score / (h.max_points || maxScale) // normalized per-heuristic
      : h.score / maxScale; // raw scale across all
    const r = radius * Math.min(1, ratio);
    return {
      idx,
      angle,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      axisX: cx + radius * Math.cos(angle),
      axisY: cy + radius * Math.sin(angle),
      code: h.code || h.title || `H${idx + 1}`,
      score: h.score,
      max: h.max_points,
      ratio: Math.min(1, ratio),
      color: colorFor(idx),
    };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");


  const avgPercent = Math.round(avgRatio * 100); // 0–100
  const avgRaw = (avgRatio * maxScale).toFixed(1);

  const centerPrimary = percentMode
    ? showPercentValues
      ? `${avgPercent}%`
      : `${avgPercent}` // same number, no % symbol
    : `${avgRaw}`;

  const centerSecondary = percentMode ? "AVG" : `AVG / ${maxScale}`;

  return (
    <Card className="relative mx-auto w-fit p-4 border-[#ED5E20]/30">
      <TooltipProvider>
        <div className="relative" style={{ width: size, height: size }}>
          {/* Local animation keyframes (scoped) */}
          <style>
            {`
            @keyframes radar-pop-in {
              0% { transform: scale(.85); opacity: .65; }
              60% { transform: scale(1.03); opacity: .9; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes radar-ring-in {
              0% { transform: scale(.96); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
           }
           @keyframes radar-axis-draw {
             from { stroke-dashoffset: 280; }
              to { stroke-dashoffset: 0; }
           }
            @keyframes radar-glow-pulse {
              0% { filter: drop-shadow(0 0 0 rgba(237,94,32,0)); }
              50% { filter: drop-shadow(0 0 10px rgba(237,94,32,.5)); }
              100% { filter: drop-shadow(0 0 0 rgba(237,94,32,0)); }
            }
            @keyframes radar-dot-ripple {
              0% { transform: scale(.7); opacity: .35; }
              70% { transform: scale(1.8); opacity: 0; }
              100% { transform: scale(1.8); opacity: 0; }
            }
            @keyframes radar-breathe {
              0% { transform: scale(1); }
             50% { transform: scale(1.03); }
              100% { transform: scale(1); }
            }
           .radar-anim-transform { transform-box: fill-box; transform-origin: center; }
           `}
          </style>
          <svg width={size} height={size} className="overflow-visible">
            <defs>
              <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#ED5E20"
                  stopOpacity={fillOpacity / 100}
                />
                <stop
                  offset="100%"
                  stopColor="#ED5E20"
                  stopOpacity={(fillOpacity - 25) / 100}
                />
              </linearGradient>
            </defs>

            {/* Level rings + labels */}
            {Array.from({ length: levels }).map((_, i) => {
              const frac = (i + 1) / levels;
              const r = radius * frac;
              return (
                <g
                  key={`level-${i}`}
                  className={canAnimate ? "radar-anim-transform" : undefined}
                  style={
                    canAnimate
                      ? {
                          animation: `radar-ring-in 500ms ease-out ${
                            (i + 1) * 70
                          }ms both`,
                        }
                      : undefined
                  }
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    className="stroke-gray-300 dark:stroke-gray-600"
                    fill="none"
                    strokeWidth={0.65}
                  />
                  {showGridLabels && (
                    <text
                      x={cx}
                      y={cy - r - 6}
                      fontSize={10}
                      textAnchor="middle"
                      className="fill-gray-400 dark:fill-gray-500"
                    >
                      {percentMode
                        ? `${Math.round(frac * 100)}%`
                        : Math.round(frac * maxScale)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Axes */}
            {points.map((p) => (
              <line
                key={`axis-${p.idx}`}
                x1={cx}
                y1={cy}
                x2={p.axisX}
                y2={p.axisY}
                stroke={
                  pinned === p.idx
                    ? p.color
                    : hover === p.idx
                    ? p.color
                    : "#d1d5db"
                }
                strokeOpacity={hover === p.idx || pinned === p.idx ? 0.9 : 0.55}
                strokeWidth={hover === p.idx || pinned === p.idx ? 1.4 : 0.65}
                className={canAnimate ? "radar-anim-transform" : undefined}
                style={
                  canAnimate
                    ? {
                        strokeDasharray: radius,
                        strokeDashoffset: radius,
                        animation: `radar-axis-draw 900ms ease-out ${
                          p.idx * 20
                        }ms both`,
                      }
                    : undefined
                }
              />
            ))}

            {/* Animated polygon */}
            <polygon
              points={polygon}
              fill="url(#radarFill)"
              stroke="#ED5E20"
              strokeWidth={1.25}
              style={{
                transition: canAnimate
                  ? "all 600ms cubic-bezier(.25,.8,.25,1)"
                  : "none",
                animation: canAnimate
                  ? "radar-pop-in 680ms ease-out both"
                  : "none",
                filter:
                  pinned != null && canAnimate
                    ? "drop-shadow(0 0 10px rgba(237,94,32,.45))"
                    : "none",
              }}
              className={
                pinned != null && canAnimate ? "radar-glow" : undefined
              }
            />

            {/* Data points */}
            {points.map((p) => (
              <g key={`pt-${p.idx}`}>
                {/* Ripple on hover/pin */}
                {(hover === p.idx || pinned === p.idx) && canAnimate && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={6}
                    fill={p.color}
                    opacity={0.25}
                    className="radar-anim-transform"
                    style={{
                      animation: "radar-dot-ripple 1700ms ease-out infinite",
                    }}
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hover === p.idx || pinned === p.idx ? 6 : 4}
                  fill={p.color}
                  stroke="white"
                  strokeWidth={1}
                  style={{
                    cursor: "pointer",
                    transition: "all 220ms cubic-bezier(.2,.7,.2,1)",
                    transform:
                      canAnimate && (hover === p.idx || pinned === p.idx)
                        ? "scale(1.08)"
                        : "scale(1)",
                  }}
                  onMouseEnter={() => setHover(p.idx)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() =>
                    setPinned((prev) => (prev === p.idx ? null : p.idx))
                  }
                />
              </g>
            ))}

            {/* Center average badge */}
            {showCenterBadge && (
              <g
                className={canAnimate ? "radar-anim-transform" : undefined}
                style={
                  canAnimate
                    ? { animation: "radar-breathe 2600ms ease-in-out infinite" }
                    : undefined
                }
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={34}
                  fill="url(#radarFill)"
                  stroke="#ED5E20"
                  strokeWidth={0.8}
                  style={{ backdropFilter: "blur(4px)" }}
                />
                <text
                  x={cx}
                  y={cy - 4}
                  fontSize={14}
                  textAnchor="middle"
                  className="fill-white font-semibold"
                >
                  {centerPrimary}
                </text>
                <text
                  x={cx}
                  y={cy + 12}
                  fontSize={9}
                  textAnchor="middle"
                  className="fill-white"
                >
                  {centerSecondary}
                </text>
              </g>
            )}

            {/* Labels */}
            {points.map((p) => {
              const lx = cx + (radius + 18) * Math.cos(p.angle);
              const ly = cy + (radius + 18) * Math.sin(p.angle);
              return (
                <text
                  key={`lbl-${p.idx}`}
                  x={lx}
                  y={ly}
                  fontSize={10}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className={
                    hover === p.idx || pinned === p.idx
                      ? "fill-gray-800 dark:fill-gray-100 font-semibold"
                      : "fill-gray-600 dark:fill-gray-300"
                  }
                  style={{
                    transition: "all 200ms",
                    transform:
                      canAnimate && (hover === p.idx || pinned === p.idx)
                        ? "scale(1.06)"
                        : "scale(1)",
                  }}
                >
                  {p.code}
                </text>
              );
            })}
          </svg>

          {/* Tooltip overlays */}
          {points.map((p) => (
            <div
              key={`tip-${p.idx}`}
              className="absolute"
              style={{ left: p.x - 16, top: p.y - 16, width: 32, height: 32 }}
              onMouseEnter={() => setHover(p.idx)}
              onMouseLeave={() => setHover(null)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="w-full h-full rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ED5E20]"
                    aria-label={`Heuristic ${p.code}`}
                  />
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: p.color }}
                    />
                    <span className="font-semibold">{p.code}</span>
                  </div>
                  {/* Tooltip value line (replace existing score line): */}
                  <div className="text-[11px] text-white-600 dark:text-white-900">
                    Score: {p.score}/{p.max}
                    {percentMode && showPercentValues
                      ? ` (${Math.round(p.ratio * 100)}%)`
                      : ""}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="mt-4">
        <ScrollArea className="max-h-28">
          <div className="flex flex-wrap gap-2 pr-2">
            {points.map((p) => (
              <Badge
                key={`badge-${p.idx}`}
                variant={
                  pinned === p.idx
                    ? "default"
                    : hover === p.idx
                    ? "default"
                    : "secondary"
                }
                onMouseEnter={() => setHover(p.idx)}
                onMouseLeave={() => setHover(null)}
                onClick={() =>
                  setPinned((prev) => (prev === p.idx ? null : p.idx))
                }
                className="cursor-pointer transition select-none"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{ background: p.color }}
                />
                {p.code}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

export default HeuristicLegendModal;
