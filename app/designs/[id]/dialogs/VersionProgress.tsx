"use client";

import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Minus,
  Sparkles,
} from "lucide-react";

type Categories = Record<string, number>;
export type VersionProgressData = {
  id: string;
  version: number;
  overall?: number;
  categories: Categories;
};

function scoreTone(n?: number) {
  if (n == null)
    return "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
  if (n >= 85) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300";
  if (n >= 70) return "bg-blue-500/15 text-blue-600 dark:text-blue-300";
  if (n >= 50) return "bg-amber-500/15 text-amber-600 dark:text-amber-300";
  return "bg-rose-500/15 text-rose-600 dark:text-rose-300";
}

function DiffArrow({ newVal, oldVal }: { newVal?: number; oldVal?: number }) {
  if (typeof newVal !== "number" || typeof oldVal !== "number")
    return <Minus className="h-3.5 w-3.5 text-gray-400" />;
  const d = newVal - oldVal;
  if (d === 0) return <Minus className="h-3.5 w-3.5 text-gray-400" />;
  if (d > 0) return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />;
  return <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />;
}

export function VersionProgress({
  previous,
  current,
  collapsed,
  onToggle,
}: {
  previous: VersionProgressData;
  current: VersionProgressData;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const oldVal = previous?.overall;
  const newVal = current?.overall;
  const hasNumbers = typeof oldVal === "number" && typeof newVal === "number";
  const delta = hasNumbers ? (newVal as number) - (oldVal as number) : 0;
  const positive = delta > 0;
  const neutral = delta === 0;

  const badgeTone = positive
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-emerald-400/30"
    : neutral
    ? "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 ring-neutral-400/30"
    : "bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-rose-400/30";

  const glowTone = positive
    ? "bg-emerald-400/25"
    : neutral
    ? "bg-neutral-400/25"
    : "bg-rose-400/25";

  const prevCats = previous?.categories ?? {};
  const currCats = current?.categories ?? {};
  const allCats = Array.from(
    new Set([...Object.keys(prevCats), ...Object.keys(currCats)])
  ).sort();

  return (
    <div
      className="mb-5 relative group rounded-2xl border border-orange-300/50 dark:border-orange-400/30
      bg-gradient-to-br from-white via-orange-50/40 to-white dark:from-[#191919] dark:via-[#242424] dark:to-[#1d1d1d]
      shadow-[0_4px_18px_-4px_rgba(0,0,0,.18)] backdrop-blur-sm overflow-hidden"
    >
      {/* Decorative accents */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-orange-400/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-amber-300/10 blur-2xl" />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 60%)",
        }}
      />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow">
              <Sparkles className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 tracking-wide">
              Version Progress
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-400/20 dark:text-orange-300 font-medium">
              v{previous?.version} → v{current?.version}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
            bg-white/80 dark:bg-neutral-800/70 border border-orange-300/40 dark:border-orange-400/30
            hover:bg-orange-50 dark:hover:bg-neutral-700 transition cursor-pointer"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand version progress" : "Collapse version progress"}
          >
            {collapsed ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>

        {/* Collapsible content */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            collapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[560px] opacity-100"
          }`}
        >
          {/* Overall comparison */}
          <div className="grid grid-cols-3 gap-3 items-end mb-5 mt-3">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide font-medium text-neutral-500 dark:text-neutral-400">
                Previous
              </p>
              <div className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${scoreTone(previous?.overall)}`}>
                {previous?.overall ?? "—"}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-1" />
              {hasNumbers ? (
                <div className="relative grid place-items-center select-none">
                  {/* Delta pill */}
                  <div
                    className={[
                      "relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ring-1 shadow-sm",
                      "transition-transform duration-300",
                      "animate-[vpPopIn_.6s_ease-out_1]",
                      badgeTone,
                    ].join(" ")}
                    title={`Overall change: ${delta > 0 ? "+" : ""}${delta}`}
                  >
                    <span
                      className={[
                        "absolute inset-0 -z-10 rounded-[14px] blur-md opacity-70",
                        "animate-[vpPulseGlow_2.2s_ease-in-out_infinite]",
                        glowTone,
                      ].join(" ")}
                      aria-hidden
                    />
                    {positive ? (
                      <ArrowUpRight className="h-3.5 w-3.5 animate-[vpArrow_.9s_ease-in-out_infinite]" />
                    ) : neutral ? (
                      <Minus className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 animate-[vpArrow_.9s_ease-in-out_infinite]" />
                    )}
                    <span className="text-sm tabular-nums">
                      {delta > 0 ? `+${delta}` : `${delta}`}
                    </span>
                    <span className="hidden sm:inline text-[10px] opacity-70">overall</span>
                  </div>
                  {/* Scoped keyframes */}
                  <style>
                    {`
                    @keyframes vpPulseGlow {
                      0%, 100% { transform: scale(1); opacity: .55; }
                      50% { transform: scale(1.02); opacity: .95; }
                    }
                    @keyframes vpPopIn {
                      0% { transform: translateY(4px) scale(.98); opacity: 0; }
                      100% { transform: translateY(0) scale(1); opacity: 1; }
                    }
                    @keyframes vpArrow {
                      0%, 100% { transform: translateY(0); }
                      50% { transform: translateY(-1px); }
                    }
                  `}
                  </style>
                </div>
              ) : (
                <p className="text-[10px] mt-1 text-neutral-500 dark:text-neutral-400 font-medium">—</p>
              )}
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] uppercase tracking-wide font-medium text-neutral-500 dark:text-neutral-400">
                Current
              </p>
              <div className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${scoreTone(current?.overall)}`}>
                {current?.overall ?? "—"}
              </div>
            </div>
          </div>

          {/* Categories diff list */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-wide text-neutral-600 dark:text-neutral-300">
              Category Changes
            </p>
            <div
              className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700
              divide-y divide-neutral-200 dark:divide-neutral-800 bg-white/70 dark:bg-neutral-900/50"
            >
              {allCats.map((cat) => {
                const oldCat = prevCats[cat];
                const newCat = currCats[cat];
                const d =
                  typeof newCat === "number" && typeof oldCat === "number"
                    ? newCat - oldCat
                    : null;
                return (
                  <div
                    key={cat}
                    className="grid grid-cols-6 gap-2 items-center px-2 py-1.5 text-xs
                    bg-white/60 dark:bg-neutral-900/40 hover:bg-orange-50/40 dark:hover:bg-neutral-800/60 transition"
                  >
                    <span className="col-span-2 capitalize text-neutral-700 dark:text-neutral-300 truncate">
                      {cat}
                    </span>
                    <span className="text-neutral-600 dark:text-neutral-300 text-right">
                      {typeof oldCat === "number" ? oldCat : "—"}
                    </span>
                    <span className="flex items-center justify-center">
                      <DiffArrow newVal={newCat} oldVal={oldCat} />
                    </span>
                    <span
                      className={`text-right font-semibold ${
                        newCat > (oldCat ?? -Infinity)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : newCat < (oldCat ?? Infinity)
                          ? "text-rose-500"
                          : "text-neutral-500 dark:text-neutral-400"
                      }`}
                    >
                      {typeof newCat === "number" ? newCat : "—"}
                    </span>
                    <span
                      className={`text-[10px] text-right ${
                        d == null
                          ? "text-neutral-400"
                          : d > 0
                          ? "text-emerald-500"
                          : d < 0
                          ? "text-rose-500"
                          : "text-neutral-500 dark:text-neutral-400"
                      }`}
                    >
                      {d == null || isNaN(d) ? (
                        "—"
                      ) : d === 0 ? (
                        <span
                          className="inline-flex items-center justify-end gap-1 px-1.5 py-0.5
                          text-neutral-600 dark:text-neutral-300"
                          title="No change"
                          aria-label="No change"
                        >
                          <Minus className="h-3 w-3 opacity-70" />
                        </span>
                      ) : (
                        (d > 0 ? "+" : "") + d
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-neutral-600 dark:text-neutral-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-400/20">
                <ArrowUpRight className="h-3 w-3" />
                Improved
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-1 ring-rose-400/20">
                <ArrowDownRight className="h-3 w-3" />
                Regressed
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 ring-1 ring-neutral-400/20">
                <Minus className="h-3 w-3" />
                No change
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex items-end gap-[3px] h-3" aria-hidden>
                <span className="w-[3px] rounded-sm bg-[#ED5E20]/85 animate-[bar1_1100ms_ease-in-out_infinite]" />
                <span className="w-[3px] rounded-sm bg-[#ED5E20]/70 animate-[bar2_950ms_ease-in-out_infinite]" />
                <span className="w-[3px] rounded-sm bg-[#ED5E20]/85 animate-[bar3_800ms_ease-in-out_infinite]" />
                <span className="w-[3px] rounded-sm bg-[#ED5E20]/60 animate-[bar2_900ms_ease-in-out_infinite]" />
                <span className="w-[3px] rounded-sm bg-[#ED5E20]/85 animate-[bar1_1050ms_ease-in-out_infinite]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}