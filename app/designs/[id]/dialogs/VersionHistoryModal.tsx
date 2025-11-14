import React, { useEffect, useMemo, useState, useCallback } from "react";
// import Image from "next/image";
import { Spinner } from "@/components/ui/shadcn-io/spinner/index";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import {
  fetchFramesForVersion,
  hideDesignVersion,
  unhideDesignVersion,
} from "@/database/actions/versions/versionHistory";

interface VersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  loadingVersions: boolean;
  versions: any[];
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  design: any;
  selectedVersion: any;
  setSelectedVersion: (v: any) => void;
  fetchDesignVersions: (id: string) => Promise<any[]>;
  deleteDesignVersion: (id: string) => Promise<void>;
  setVersions: (v: any[]) => void;
  setVersionChanged: (fn: (v: number) => number) => void;
  setEvalResult: (result: any) => void;
  setShowEval: (show: boolean) => void;
  setFrameEvaluations: (frames: any[]) => void;
  fetchWeaknesses?: (
    designId?: string | null,
    versionId?: string | null
  ) => Promise<void>;
  setSelectedFrameIndex: (i: number) => void;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  open,
  onClose,
  loadingVersions,
  versions,
  page,
  pageSize,
  setPage,
  design,
  selectedVersion,
  setSelectedVersion,
  fetchDesignVersions,
  deleteDesignVersion,
  setVersions,
  setVersionChanged,
  setEvalResult,
  setShowEval,
  setFrameEvaluations,
  fetchWeaknesses,
  setSelectedFrameIndex,
}) => {
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const [showHidden, setShowHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("vh_showHidden");
    return saved === "true";
  });

  const hiddenCount = versions.filter((v) => v.is_hidden).length;

  // Memoize filtered + paged list: keeps stable logic when page changes
  const pagedVersions = useMemo(() => {
    const base = showHidden ? versions : versions.filter((v) => !v.is_hidden);
    const start = page * pageSize;
    return base.slice(start, start + pageSize);
  }, [versions, showHidden, page, pageSize]);

  // Hide handler (replace inline logic)
  async function handleHide(v: any) {
    setMutatingId(v.id);
    try {
      await hideDesignVersion(v.id);
      setVersions(
        versions.map((ver) =>
          ver.id === v.id ? { ...ver, is_hidden: true } : ver
        )
      );
      if (selectedVersion?.id === v.id) setSelectedVersion(null);
      toast.success(
        <span>
          <span className="font-bold text-[#ED5E20]">v{v.version}</span> hidden.
        </span>
      );
    } catch (err: any) {
      toast.error(
        <span className="text-xs">
          Failed to hide version. {err?.message || ""}
        </span>
      );
    } finally {
      setMutatingId(null);
    }
  }

  // Unhide handler
  async function handleUnhide(v: any) {
    setMutatingId(v.id);
    try {
      await unhideDesignVersion(v.id);
      setVersions(
        versions.map((ver) =>
          ver.id === v.id ? { ...ver, is_hidden: false } : ver
        )
      );
      toast.success(
        <span>
          <span className="font-bold text-[#ED5E20]">v{v.version}</span>{" "}
          unhidden.
        </span>
      );
    } catch (err: any) {
      toast.error(
        <span className="text-xs">
          Failed to unhide version. {err?.message || ""}
        </span>
      );
    } finally {
      setMutatingId(null);
    }
  }

  const computeFrameScoreFromAi = useCallback((ai: any): number => {
    if (!ai || typeof ai !== "object") return 0;
    const dc = ai?.debug_calc;

    // Heuristic average
    let heurAvg: number | undefined =
      typeof dc?.heuristics_avg === "number" ? dc.heuristics_avg : undefined;

    if (heurAvg === undefined) {
      const hb: any[] = Array.isArray(ai?.heuristic_breakdown)
        ? ai.heuristic_breakdown
        : [];

      if (hb.length) {
        const pctSum = hb.reduce((acc, h) => {
          const s = typeof h?.score === "number" ? h.score : 0;
          const m =
            typeof h?.max_points === "number" && h.max_points > 0
              ? h.max_points
              : 4;
          return acc + (s / m) * 100;
        }, 0);
        heurAvg = Math.round(pctSum / hb.length);
      }
    }

    // Category average
    const cs =
      ai?.category_scores && typeof ai.category_scores === "object"
        ? ai.category_scores
        : undefined;

    const catVals = cs
      ? Object.values(cs).filter(
          (v: any): v is number => typeof v === "number" && Number.isFinite(v)
        )
      : [];

    const catAvg = catVals.length
      ? Math.round(catVals.reduce((a, b) => a + b, 0) / catVals.length)
      : undefined;

    // Bias weighted
    const biasWeighted =
      typeof dc?.bias_weighted_overall === "number"
        ? dc.bias_weighted_overall
        : typeof ai?.bias?.weighted_overall === "number"
        ? ai.bias.weighted_overall
        : undefined;

    const tri =
      typeof heurAvg === "number" &&
      typeof catAvg === "number" &&
      typeof biasWeighted === "number"
        ? Math.round((heurAvg + catAvg + biasWeighted) / 3)
        : undefined;

    if (typeof tri === "number") return tri;
    if (typeof dc?.final === "number") return dc.final;
    if (typeof ai?.overall_score === "number") return ai.overall_score;
    if (typeof catAvg === "number" && typeof heurAvg === "number")
      return Math.round((catAvg + heurAvg) / 2);
    if (typeof catAvg === "number") return catAvg;
    if (typeof heurAvg === "number") return heurAvg;
    return 0;
  }, []);

  const computeVersionScore = useCallback(
    (v: any): number | null => {
      if (
        typeof v?.total_score === "number" &&
        Number.isFinite(v.total_score)
      ) {
        return Math.round(v.total_score);
      }

      let raw = v?.ai_data;
      if (!raw) return null;
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch {
          return null;
        }
      }

      const collect = (x: any): any[] => {
        if (!x) return [];
        if (Array.isArray(x)) return x;
        if (typeof x === "object") {
          const keys = Object.keys(x);
          if (keys.length && keys.every((k) => /^\d+$/.test(k))) {
            return keys.sort((a, b) => Number(a) - Number(b)).map((k) => x[k]);
          }
          if ("ai" in x) return [x];
          return [x];
        }
        return [];
      };

      const entries = collect(raw).map((e) => (e?.ai ? e.ai : e));
      const scores = entries
        .map((ai) => computeFrameScoreFromAi(ai))
        .filter((n) => typeof n === "number" && Number.isFinite(n));

      if (!scores.length) return null;
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    },
    [computeFrameScoreFromAi]
  ); // include deps of helpers you use

  const augmentedPaged = useMemo(() => {
    return pagedVersions.map((v) => {
      const displayScore = computeVersionScore(v);
      console.log({ 
        ...v
      });
      return { ...v, displayScore};
    });
  }, [pagedVersions, computeVersionScore]);

  //  Persist showHidden across pagination / modal reopen
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vh_showHidden", String(showHidden));
    }
  }, [showHidden]);

  useEffect(() => {
    const baseLength = showHidden
      ? versions.length
      : versions.filter((v) => !v.is_hidden).length;
    const maxPage = Math.max(0, Math.ceil(baseLength / pageSize) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [showHidden, versions, page, pageSize, setPage]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pl-20 pr-20 z-50">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity backdrop-blur-md"
        onClick={onClose}
      />
      <div className="bg-gray-50 border dark:bg-[#1A1A1A] relative rounded-xl p-10 max-h-[85vh] overflow-y-auto w-full z-50">
        <h2 className="text-lg font-semibold mb-3 relative flex items-center justify-center">
          <span className="mx-auto">Version History</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer p-2 rounded hover:bg-[#ED5E20]/15 hover:text-[#ED5E20] transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </h2>
        {loadingVersions ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner className="w-10 h-10 text-[#ED5E20] animate-spin mb-4" />
            <span className="text-lg font-semibold text-[#ED5E20] animate-pulse">
              Loading Version History...
            </span>
            <span className="text-sm text-gray-400 mt-2">
              Please wait while we fetch your design versions.
            </span>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#ED5E20] dark:bg-[#ED5E20] text-white dark:text-white">
                    {/* <th className="p-2 border">Version Id</th> */}
                    <th className="p-2 border">Version</th>
                    <th className="p-2 border">Score</th>
                    <th className="p-2 border">AI Summary</th>
                    {/* <th className="p-2 border">Parameter</th> */}
                    {/* <th className="p-2 border">Thumbnail</th> */}
                    <th className="p-2 border">Evaluated at</th>
                    <th className="p-2 border text-center">Hide</th>
                  </tr>
                </thead>
                <tbody>
                  {augmentedPaged.map((v) => {
                    const isCurrent =
                      String(v.id).trim() ===
                      String(design?.current_version_id).trim();
                    const isSelected = selectedVersion?.id === v.id;
                    const isHidden = !!v.is_hidden;
                    return (
                      <tr
                        key={v.id}
                        className={
                          "cursor-pointer transition " +
                          (isCurrent
                            ? "hover:bg-[#ED5E20]/10 dark:hover:bg-[#ED5E20]/10"
                            : isSelected
                            ? "bg-[#ED5E20]/20 dark:bg-[#ED5E20]/20"
                            : "hover:bg-[#ED5E20]/10 dark:hover:bg-[#ED5E20]/10") +
                          (isHidden ? " opacity-55 saturate-50" : "")
                        }
                        onClick={async () => {
                          setSelectedVersion(v);
                          try {
                            const frames = await fetchFramesForVersion(
                              v.id,
                              design.id
                            );
                            const framesOnly = Array.isArray(frames)
                              ? frames.filter(
                                  (f: any) => f?.id !== "overallFrame"
                                )
                              : [];
                            setFrameEvaluations(framesOnly);
                            setSelectedFrameIndex(0);
                            // TODO: here
                            try {
                              await fetchWeaknesses?.(design.id, v.id);
                            } catch (wErr) {
                              console.warn(
                                "fetchWeaknesses failed for selected version",
                                v.id,
                                wErr
                              );
                            }

                            const versions = await fetchDesignVersions(
                              design.id
                            );
                            const latest = versions.find(
                              (ver) => ver.id === v.id
                            );

                            if (!latest) {
                              toast.error(
                                "Failed to fetch latest version data."
                              );
                              return;
                            }

                            let parsedAiData = null;
                            try {
                              parsedAiData =
                                typeof latest.ai_data === "string"
                                  ? JSON.parse(latest.ai_data)
                                  : latest.ai_data;
                            } catch {}

                            if (parsedAiData) {
                              setEvalResult({
                                nodeId: latest.node_id,
                                imageUrl: latest.thumbnail_url,
                                summary:
                                  latest.ai_summary ??
                                  parsedAiData.summary ??
                                  "",
                                heuristics: parsedAiData.heuristics ?? null,
                                ai_status: "ok",
                                overall_score:
                                  parsedAiData.overall_score ?? null,
                                strengths: Array.isArray(parsedAiData.strengths)
                                  ? parsedAiData.strengths
                                  : [],
                                weaknesses: Array.isArray(
                                  parsedAiData.weaknesses
                                )
                                  ? parsedAiData.weaknesses
                                  : [],
                                issues: Array.isArray(parsedAiData.issues)
                                  ? parsedAiData.issues
                                  : [],
                                category_scores:
                                  parsedAiData.category_scores ?? null,
                                ai: parsedAiData,
                              });
                              setShowEval(true);
                            }
                            onClose();
                          } catch (error) {
                            toast.error(`Error loading version data. ${error}`);
                          }
                        }}
                      >
                        {/* VERSION ID */}
                        {/* <td className="p-2 border text-center text-gray-700 dark:text-gray-200">
                          <span
                            className="font-mono text-xs text-gray-600 dark:text-gray-300 truncate block"
                            title={String(v.id)}
                            style={{ maxWidth: 220 }}
                          >
                            {String(v.id)}
                          </span>
                        </td> */}
                        {/*VERSION*/}
                        <td className="p-2 border text-center text-gray-700 dark:text-gray-200">
                          {isCurrent ? (
                            <span
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#ED5E20] to-orange-400 text-white text-xs font-semibold shadow-md animate-pulse"
                              style={{
                                boxShadow: "0 2px 8px 0 rgba(237,94,32,0.18)",
                                letterSpacing: "0.03em",
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 20 20"
                                fill="none"
                                className="mr-1"
                              >
                                <circle
                                  cx="10"
                                  cy="10"
                                  r="10"
                                  fill="#fff"
                                  fillOpacity="0.18"
                                />
                                <path
                                  d="M6 10.5l2.5 2.5L14 8"
                                  stroke="#fff"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Current
                            </span>
                          ) : (
                            v.version
                          )}
                        </td>

     {/*SCORE*/}
                        <td className="p-2 border text-gray-700 dark:text-gray-200 text-center">
                          {v.displayScore != null
                            ? v.displayScore
                            : v.total_score != null
                            ? Math.round(v.total_score)
                            : "-"}
                        </td> 

                        {/*AI SUMMARY*/}
                                               <td className="p-2 border text-gray-700 dark:text-gray-200">
                          {(() => {
                            const s: any = v.ai_summary;
                            if (!s) return "-";
                            if (typeof s === "string") {
                              try {
                                const parsed: any = JSON.parse(s);
                                return parsed?.narrative ?? parsed?.long ?? parsed?.short ?? s;
                              } catch {
                                return s; // plain string
                              }
                            }
                            if (typeof s === "object") {
                              return s?.narrative ?? s?.long ?? s?.short ?? "-";
                            }
                            return "-";
                          })()}
                        </td> 

                        {/*PARAMETERS*/}
                        {/* <td className="p-5 border align-middle text-gray-700 dark:text-gray-200">
                                                    {(() => {
                                                        let age = "-";
                                                        let occupation = "-";
                                                        try {
                                                            const snap = typeof v.snapshot === "string" ? JSON.parse(v.snapshot) : v.snapshot;
                                                            age = snap?.age ?? "-";
                                                            occupation = snap?.occupation ?? "-";
                                                        } catch { }
                                                        // Use stronger contrast for current version
                                                        const badgeAgeClass = isCurrent
                                                            ? "bg-[#ED5E20] text-white border border-[#ED5E20]"
                                                            : "bg-[#ED5E20]/10 text-[#ED5E20] border border-[#ED5E20]/30";
                                                        const badgeOccClass = isCurrent
                                                            ? "bg-orange-700 text-white border border-orange-700"
                                                            : "bg-orange-400/10 text-orange-700 border border-orange-400/30";
                                                        return (
                                                            <div className="items-center space-y-1">
                                                                <span className={`w-full inline-flex items-center px-4 py-0.5 min-w-[90px] justify-center rounded-full text-xs font-semibold ${badgeAgeClass}`}>
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 16 16">
                                                                        <path d="M7 2l-4 7h4v5l4-7H7V2z" />
                                                                    </svg>
                                                                    {typeof age === "string"
                                                                        ? age.replace(/\s+/g, " ").trim()
                                                                        : age}
                                                                </span>
                                                                <span className={`w-full inline-flex items-center px-4 py-0.5 min-w-[90px] justify-center rounded-full text-xs font-semibold ${badgeOccClass}`}>
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 16 16">
                                                                        <path d="M8 2a3 3 0 0 1 3 3c0 1.657-1.343 3-3 3S5 6.657 5 5a3 3 0 0 1 3-3zm0 7c2.21 0 4 1.343 4 3v2H4v-2c0-1.657 1.79-3 4-3z" />
                                                                    </svg>
                                                                    {occupation}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </td> */}

                        {/*THUMBNAIL*/}
                        {/* <td className="p-2 border text-gray-700 dark:text-gray-200">
                                                    {v.thumbnail_url && v.thumbnail_url.startsWith("http") ? (
                                                        <Image src={v.thumbnail_url} alt="thumb"
                                                            width={70}
                                                            height={50}
                                                            className="object-cover" />
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td> */}

                        {/*EVALUATION TIME*/}
                        <td className="p-2 border text-gray-700 dark:text-gray-200 text-center">
                          {v.created_at
                            ? new Date(v.created_at).toLocaleString()
                            : "-"}
                        </td>

                        {/* HIDE BUTTON */}
                        <td className="p-2 border text-center text-gray-700 dark:text-gray-200">
                          {!isCurrent && !isHidden && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                toast(
                                  (t) => {
                                    const toastId = `hide-version-${v.id}`;
                                    return (
                                      <div className="flex flex-col items-center gap-2 p-4 ml-8">
                                        <span className="text-base font-semibold text-[#ED5E20] text-center">
                                          Hide version{" "}
                                          <span className="font-bold">
                                            v{v.version}
                                          </span>
                                          ?
                                        </span>
                                        <span className="mt-1 text-xs text-gray-500 text-center">
                                          You can unhide later. Data is
                                          preserved.
                                        </span>
                                        <div className="flex gap-6 mt-4 justify-center w-full">
                                          <button
                                            onClick={async () => {
                                              toast.dismiss(toastId);
                                              try {
                                                await hideDesignVersion(v.id);
                                                setVersions(
                                                  versions.map((ver) =>
                                                    ver.id === v.id
                                                      ? {
                                                          ...ver,
                                                          is_hidden: true,
                                                        }
                                                      : ver
                                                  )
                                                );
                                                if (
                                                  selectedVersion?.id === v.id
                                                )
                                                  setSelectedVersion(null);
                                                setVersionChanged((x) => x + 1);
                                                toast.success(
                                                  <span>
                                                    <span className="font-bold text-[#ED5E20]">
                                                      v{v.version}
                                                    </span>{" "}
                                                    hidden.
                                                  </span>
                                                );
                                              } catch (err: any) {
                                                toast.error(
                                                  <span className="text-xs">
                                                    Failed to hide version.{" "}
                                                    {err?.message || ""}
                                                  </span>
                                                );
                                              }
                                            }}
                                            className="px-6 py-2 rounded-full bg-gradient-to-r from-[#ED5E20] to-orange-400 text-white font-bold shadow-lg hover:scale-105 hover:from-orange-500 hover:to-[#ED5E20] transition-all duration-200"
                                          >
                                            Yes, Hide
                                          </button>
                                          <button
                                            onClick={() =>
                                              toast.dismiss(toastId)
                                            }
                                            className="px-6 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold shadow hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-200"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  },
                                  {
                                    id: `hide-version-${v.id}`,
                                    duration: 9000,
                                  }
                                );
                              }}
                              className="text-orange-600 hover:text-white hover:bg-orange-500 rounded-full p-1 transition-all duration-200"
                              title="Hide version"
                            ></button>
                          )}
                          {!isCurrent && !isHidden && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHide(v);
                              }}
                              disabled={mutatingId === v.id}
                              className={`text-orange-600 rounded-full p-1 transition ${
                                mutatingId === v.id
                                  ? "opacity-50 cursor-wait"
                                  : "hover:text-white hover:bg-orange-500 cursor-pointer"
                              }`}
                              title="Hide version"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          {isHidden && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnhide(v);
                              }}
                              disabled={mutatingId === v.id}
                              className={`text-green-600 rounded-full p-1 transition ${
                                mutatingId === v.id
                                  ? "opacity-50 cursor-wait"
                                  : "hover:text-white hover:bg-green-500 cursor-pointer"
                              }`}
                              title="Unhide version"
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 1l22 22" />
                                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-6.94M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
                                <path d="M12 5c7 0 11 7 11 7a21.77 21.77 0 0 1-2.38 3.16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Hide Button */}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => hiddenCount > 0 && setShowHidden((x) => !x)}
                disabled={hiddenCount === 0}
                className={`px-4 py-2 rounded-full border text-sm font-semibold transition
                  ${
                    hiddenCount === 0
                      ? "bg-gray-100 dark:bg-gray-800 border-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-white/80 dark:bg-[#232323]/80 border-[#ED5E20]/40 text-[#ED5E20] hover:bg-[#ED5E20] hover:text-white cursor-pointer"
                  }`}
              >
                {hiddenCount === 0
                  ? "No hidden versions"
                  : showHidden
                  ? "Hide hidden versions"
                  : `Show hidden versions`}
              </button>
              {/* <span className="text-xs text-gray-500">
                {hiddenCount === 0
                  ? "All versions are visible."
                  : showHidden
                  ? "Displaying all versions (including hidden)."
                  : "Hidden versions are excluded."}
              </span> */}
            </div>

            {/* Pagination  */}
            {versions.length > pageSize && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 px-2">
                {/* Progress Bar */}
                <div className="w-full sm:w-1/2 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-[#ED5E20] to-orange-400 transition-all duration-500"
                    style={{
                      width: `${
                        ((page + 1) /
                          Math.ceil(
                            (showHidden
                              ? versions.length
                              : versions.filter((v) => !v.is_hidden).length) /
                              pageSize
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                {/* Pagination Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className={`group relative flex items-center justify-center px-4 py-2 rounded-full
                                    bg-white/80 dark:bg-[#232323]/80 shadow-lg border border-[#ED5E20]/30
                                    text-[#ED5E20] dark:text-[#ED5E20] font-bold text-base
                                    transition-all duration-300
                                    hover:bg-[#ED5E20] hover:text-white hover:scale-110 active:scale-95
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                    outline-none focus:ring-2 focus:ring-[#ED5E20]/40
                                    cursor-pointer
                                    `}
                    aria-label="Previous Page"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-1"
                    >
                      <path
                        d="M15 19l-7-7 7-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Back
                    <span className="absolute -inset-1 rounded-full pointer-events-none group-hover:animate-pulse" />
                  </button>
                  <span className="mx-2 text-sm font-semibold tracking-wide bg-gradient-to-r from-[#ED5E20]/80 to-orange-400/80 text-white px-4 py-1 rounded-full shadow">
                    Page {page + 1} of{" "}
                    {Math.ceil(
                      (showHidden
                        ? versions.length
                        : versions.filter((v) => !v.is_hidden).length) /
                        pageSize
                    )}
                  </span>
                  <button
                    onClick={() =>
                      setPage(
                        Math.min(
                          Math.ceil(versions.length / pageSize) - 1,
                          page + 1
                        )
                      )
                    }
                    disabled={(page + 1) * pageSize >= versions.length}
                    className={`group relative flex items-center justify-center px-4 py-2 rounded-full
                                    bg-white/80 dark:bg-[#232323]/80 shadow-lg border border-[#ED5E20]/30
                                    text-[#ED5E20] dark:text-[#ED5E20] font-bold text-base
                                    transition-all duration-300
                                    hover:bg-[#ED5E20] hover:text-white hover:scale-110 active:scale-95
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                    outline-none focus:ring-2 focus:ring-[#ED5E20]/40
                                    cursor-pointer`}
                    aria-label="Next Page"
                  >
                    Next
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="ml-1"
                    >
                      <path
                        d="M9 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="absolute -inset-1 rounded-full pointer-events-none group-hover:animate-pulse" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VersionHistoryModal;
