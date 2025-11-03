// ...existing code...
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export interface IWeakness {
  id?: string;
  message?: string;
  element?: string;
  description?: string;
  impactLevel?: "low" | "medium" | "high" | string;
  suggestion?: string;
  node_id?: string;
  frameId?: string;
  thumbnail_url?: string;
  versionId?: string;
}

const Modal: React.FC<{
  open: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}> = ({ open, children }) => {
  if (!open) return null;
  return <>{children}</>;
};

interface Props {
  open: boolean;
  onClose: () => void;
  weaknesses?: IWeakness[];
  onApplyFixes: (opts?: { frameId?: string }) => Promise<void>;
  onRecheck: (opts?: { frameId?: string }) => Promise<void>;
  versionIdToShow?: string | null;
  displayVersionToShow?: string | null;
}

export default function WeaknessesModal({
  open,
  onClose,
  weaknesses,
  versionIdToShow = null,
  displayVersionToShow = null,
  onApplyFixes,
  onRecheck,
}: Props) {
  const params = useParams();
  const designId = params?.id;

  // initialize from parent-provided displayVersionToShow to avoid flicker
  const [displayVersionNumber, setDisplayVersionNumber] = useState<
    string | null
  >(() => displayVersionToShow ?? null);

  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolving, setResolving] = useState<boolean>(false);

  const modalContentRef = useRef<HTMLDivElement | null>(null);

  const weaknessList = useMemo<IWeakness[]>(
    () => weaknesses ?? [],
    [weaknesses]
  );

  // prevent background scroll while modal is open, but allow scrolling inside modal
  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    // only block touchmove when the touch is outside the modal content
    const preventTouch = (e: TouchEvent) => {
      const target = e.target as Node | null;

      // IMPORTANT: allow touches until modalContentRef is mounted to avoid a race
      // that blocks all touches while ref is still null.
      if (!modalContentRef.current) return;

      // if the touch is inside the modal content, allow default (scroll)
      if (target && modalContentRef.current.contains(target)) {
        return;
      }
      // otherwise block (prevent background scroll)
      e.preventDefault();
    };

    document.addEventListener("touchmove", preventTouch, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.removeEventListener("touchmove", preventTouch as EventListener);
    };
  }, [open]);

  const displayed = useMemo(() => {
    if (!versionIdToShow) return weaknessList;
    return weaknessList.filter(
      (w) => String(w.versionId) === String(versionIdToShow)
    );
  }, [weaknessList, versionIdToShow]);

  //   console.log("[CHECKING THE DYNAMIC]: ", displayed);
  //   toast.message(`CHECKING THE DYANMIC: ${displayed}`);

  const groups = useMemo(() => {
    const map = new Map<string, IWeakness[]>();
    displayed.forEach((raw) => {
      const normalizedFrameId =
        (raw as any).frameId ??
        (raw as any).frameEvalId ??
        (raw as any).frame_id ??
        raw.node_id ??
        "ungrouped";
      const w: IWeakness = { ...raw, frameId: normalizedFrameId };
      const arr = map.get(normalizedFrameId) ?? [];
      arr.push(w);
      map.set(normalizedFrameId, arr);
    });

    return Array.from(map.entries()).map(([id, items]) => {
      const thumbItem =
        items.find((it) => it.thumbnail_url) ??
        (items.find((it) => (it as any).thumbnailUrl) as any);
      let thumbnail =
        thumbItem?.thumbnail_url ?? (thumbItem as any)?.thumbnailUrl ?? null;
      if (!thumbnail) {
        const dvItem =
          items.find((it) => (it as any).design_version) ??
          items.find((it) => (it as any).version) ??
          items[0];
        thumbnail =
          (dvItem &&
            ((dvItem as any).design_version?.thumbnail_url ??
              (dvItem as any).version?.thumbnail_url ??
              (dvItem as any).versionThumbnail)) ??
          null;
      }
      const severityRank = { low: 1, medium: 2, high: 3 } as Record<
        string,
        number
      >;
      const highest = items.reduce<{ rank: number; level: string }>(
        (acc, it) => {
          const level = (it.impactLevel ?? "medium").toString();
          const rank = severityRank[level] ?? 2;
          return rank > acc.rank ? { rank, level } : acc;
        },
        { rank: 0, level: "medium" }
      );
      return { id, items, thumbnail, highestSeverity: highest.level };
    });
  }, [displayed]);

  const frameIndexMap = useMemo(() => {
    const isOverview = (id: string) =>
      id === "ungrouped" || id === "version-global";
    const map = new Map<string, number>();
    let counter = 0;
    groups.forEach((g) => {
      if (isOverview(g.id)) {
        map.set(g.id, 0);
      } else {
        counter += 1;
        map.set(g.id, counter);
      }
    });
    return map;
  }, [groups]);

  const inferVersionFromList = (
    items: IWeakness[] | undefined
  ): string | null => {
    if (!items || items.length === 0) return null;
    const nums = items
      .map((w) => {
        const raw = (w as any).versionId ?? (w as any).version ?? "";
        const digits = String(raw).match(/\d+/g)?.join("") ?? "";
        const n = Number(digits);
        return Number.isNaN(n) ? null : n;
      })
      .filter((n): n is number => n !== null);
    if (nums.length === 0) return null;
    return String(Math.max(...nums));
  };

  // show which version the modal is currently displaying
  // prefer explicit versionIdToShow, otherwise infer from displayed items
  const currentVersionId = useMemo((): string | null => {
    if (versionIdToShow) return versionIdToShow;
    if (!displayed || displayed.length === 0) return null;
    const found = (displayed as any[]).find((w) => (w as any).versionId);
    return found?.versionId ?? (displayed[0] as any)?.versionId ?? null;
  }, [versionIdToShow, displayed]);

  // keep local displayVersionNumber in sync when parent updates the provided string
  useEffect(() => {
    if (displayVersionToShow && displayVersionToShow !== displayVersionNumber) {
      setDisplayVersionNumber(displayVersionToShow);
    }
    // do not clear local value when prop becomes null/undefined
  }, [displayVersionToShow, displayVersionNumber]);

  useEffect(() => {
    if (!open) return;
    const immediate =
      displayVersionToShow ??
      versionIdToShow ??
      currentVersionId ??
      inferVersionFromList(weaknesses) ??
      null;
    if (immediate && immediate !== displayVersionNumber) {
      setDisplayVersionNumber(String(immediate));
    }
    // don't clear it here if immediate is null
  }, [
    open,
    displayVersionToShow,
    versionIdToShow,
    currentVersionId,
    weaknesses,
    displayVersionNumber,
  ]);

  useEffect(() => {
    // when groups change, keep the current expanded if it still exists,
    // otherwise pick the first group (or clear if none)
    if (!groups.length) {
      setExpanded(null);
      return;
    }
    setExpanded((prev) => {
      if (prev && groups.some((g) => g.id === prev)) return prev;
      return groups[0].id;
    });
  }, [groups]);

  useEffect(() => {
    const supabase = createClient();
    if (!designId) return;

    let mounted = true;
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from("design_versions")
        .select("version")
        .eq("design_id", designId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (!mounted) return;
      if (error) {
        console.error("Failed to fetch  latest version: ", error.message);
        return;
      }
      if (data) setLatestVersion(Number(data.version));
    };

    fetchLatest();
    return () => {
      mounted = false;
    };
  }, [designId]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const supabase = createClient();

    const resolveVersion = async () => {
      try {
        setResolving(true);

        // if parent already gave a display value, prefer that and skip
        if (displayVersionToShow) {
          setResolving(false);
          return;
        }

        // try resolving explicit id/uuid -> numeric version
        const tryResolveId = async (idLike?: string | null) => {
          if (!idLike) return null;
          // try by id
          let q = await supabase
            .from("design_versions")
            .select("version")
            .eq("id", idLike)
            .maybeSingle();
          if (q.data && !q.error) return String(q.data.version);
          // if numeric-like, use numeric
          const asNum = Number(idLike);
          if (!Number.isNaN(asNum)) return String(asNum);
          // try by version value
          q = await supabase
            .from("design_versions")
            .select("version")
            .eq("version", idLike)
            .maybeSingle();
          if (q.data && !q.error) return String(q.data.version);
          return null;
        };

        const candidates = [versionIdToShow, currentVersionId];
        for (const c of candidates) {
          const v = await tryResolveId(c);
          if (!mounted) return;
          if (v) {
            if (v !== displayVersionNumber) setDisplayVersionNumber(v);
            setResolving(false);
            return;
          }
        }

        if (latestVersion != null) {
          const v = String(latestVersion);
          if (v !== displayVersionNumber) setDisplayVersionNumber(v);
          setResolving(false);
          return;
        }

        // final fallback: fetch latest version; only set if found
        const { data, error } = await supabase
          .from("design_versions")
          .select("version")
          .order("version", { ascending: false })
          .limit(1)
          .single();

        if (!mounted) return;
        if (!error && data && data.version != null) {
          const v = String(data.version);
          if (v !== displayVersionNumber) setDisplayVersionNumber(v);
        }
      } catch (err) {
        console.error("Error resolving display version:", err);
      } finally {
        if (mounted) setResolving(false);
      }
    };

    resolveVersion();
    return () => {
      mounted = false;
    };
  }, [
    open,
    designId,
    versionIdToShow,
    currentVersionId,
    latestVersion,
    displayVersionToShow,
    displayVersionNumber,
    weaknesses,
  ]);

  const visibleVersion =
    displayVersionNumber ??
    inferVersionFromList(weaknesses) ??
    currentVersionId ??
    (latestVersion != null ? String(latestVersion) : null);

  // useEffect(() => {
  //   console.error("WeaknessesModal debug");
  //   console.error("open:", open);
  //   console.error("versionIdToShow:", versionIdToShow);
  //   console.error("weaknessList.length:", weaknessList.length);
  //   console.error("displayed.length:", displayed.length);
  //   // log first few versionIds present
  //   console.error(
  //     "sample versionIds:",
  //     weaknessList.slice(0, 6).map((w) => w.versionId ?? "(no-version)")
  //   );

  //   // assert all displayed items share expected version (if versionIdToShow provided)
  //   if (versionIdToShow) {
  //     const mismatch = displayed.find(
  //       (x) => String(x.versionId) !== String(versionIdToShow)
  //     );
  //     if (mismatch)
  //       console.warn(
  //         "Displayed contains items with different versionId:",
  //         mismatch.versionId,
  //         "example item:",
  //         mismatch
  //       );
  //   }
  //   // log groups summary
  //   console.warn(
  //     "groups summary:",
  //     groups.map((g) => ({
  //       id: g.id,
  //       count: g.items.length,
  //       sampleIds: g.items
  //         .slice(0, 3)
  //         .map((i) => i.id ?? i.message ?? "(no-id)"),
  //     }))
  //   );
  //   // if you want to inspect a specific frame id (replace 'frame-1-id' with real id)
  //   const frameToCheck = groups.find((g) => g.id === "frame-1-id");
  //   if (frameToCheck) {
  //     console.log("frame-1-id items:", frameToCheck.items.slice(0, 10));
  //   } else {
  //     console.log("frame-1-id not found in groups");
  //   }
  //   console.groupEnd();
  // }, [open, weaknessList, displayed, groups, versionIdToShow]);

  // pagination helpers (prev / next frame)
  const currentIndex = groups.findIndex((g) => g.id === expanded);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < groups.length - 1;
  const goPrev = () => {
    if (!canPrev) return;
    setExpanded(groups[currentIndex - 1].id);
  };
  const goNext = () => {
    if (!canNext) return;
    setExpanded(groups[currentIndex + 1].id);
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-full px-4 py-6">
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-6 overflow-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="weaknesses-title"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-150"
            onClick={onClose}
          />

          <div
            ref={modalContentRef}
            className="relative z-10 w-full max-w-6xl max-h-[90vh] bg-white dark:bg-[#0b0b0b] rounded-2xl shadow-2xl p-6 flex flex-col overflow-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {/* <span
                    className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-slate-200"
                    aria-hidden
                  >
                    {weaknesses.length}
                  </span> */}
                  <div>
                    <h2
                      id="weaknesses-title"
                      className="text-2xl sm:text-3xl font-bold gradient-text truncate"
                    >
                      Detected Issues
                    </h2>

                    {/* Version box positioned below the title, theme-aware outline */}
                    <div className="mt-3">
                      <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-md border border-slate-200 dark:border-neutral-800 bg-white/50 dark:bg-black/10 shadow-sm">
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Version
                        </div>
                        <div className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {visibleVersion}
                        </div>
                      </div>
                    </div>

                    {/* <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
                      Grouped per frame for easier review — expand a frame to
                      see its issues.
                    </p> */}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <button
                  className="px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                  onClick={onClose}
                  aria-label="Close weaknesses modal"
                >
                  <X />
                </button>
              </div>
            </div>

            {/* Body: left = frames list, right = details */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              {/* frames list / overview */}
              <div className="col-span-1 overflow-auto border-r pr-3">
                {groups.map((g) => {
                  const groupVersion =
                    g.items[0]?.versionId ?? currentVersionId ?? "no-version";
                  const idxNum = frameIndexMap.get(g.id) ?? 0;
                  const frameLabel =
                    idxNum === 0 ? "All Frames" : `Frames ${idxNum}`;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setExpanded(g.id)}
                      data-version={groupVersion}
                      className={`w-full flex items-center gap-3 p-3 mb-2 rounded-lg text-left transition ${
                        expanded === g.id
                          ? "bg-gradient-to-r from-[#FFFAF5] to-white dark:from-neutral-800/60 dark:to-neutral-800/40 ring-1 ring-[#ED5E20]/20"
                          : "hover:bg-gray-50 dark:hover:bg-neutral-900/40 cursor-pointer"
                      }`}
                    >
                      {g.thumbnail ? (
                        <Image
                          src={g.thumbnail}
                          alt={`frame-${g.id}`}
                          width={56}
                          height={40}
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="w-14 h-10 bg-neutral-100 dark:bg-neutral-800 rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          <span className="inline-flex items-center gap-2">
                            <span>{frameLabel}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                              {/* THIS is the versionId */}
                              {/* {groupVersion} */}
                            </span>
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {/* {g.items.length} issue{g.items.length > 1 ? "s" : ""}{" "} */}
                          {/* · {g.highestSeverity} */}
                        </div>
                      </div>
                      {(() => {
                        const isOverview = idxNum === 0;
                        // compute unique total across all groups to avoid double-counting duplicates
                        const totalCount = groups.reduce((sum, grp) => {
                          const gIdx = frameIndexMap.get(grp.id) ?? 0;
                          return gIdx === 0
                            ? sum
                            : sum + (grp.items?.length ?? 0);
                        }, 0);
                        const count = isOverview ? totalCount : g.items.length;
                        const level =
                          count >= 5 ? "high" : count >= 2 ? "medium" : "low";
                        const base =
                          "px-2 py-1 rounded-full text-xs font-mono font-bold border";
                        const color =
                          level === "high"
                            ? "border-[#E11D48] bg-[#E11D48]/10 text-[#E11D48] dark:border-[#E11D48]/20"
                            : level === "medium"
                            ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B] dark:border-[#F59E0B]/20"
                            : "border-[#10B981] bg-[#10B981]/10 text-[#10B981] dark:border-[#10B981]/20";
                        const label = isOverview
                          ? `${count} total issue${count !== 1 ? "s" : ""}`
                          : `${count} issue${count !== 1 ? "s" : ""}`;
                        return (
                          <span className={`${base} ${color}`} aria-hidden>
                            {label}
                          </span>
                        );
                      })()}
                    </button>
                  );
                })}
                {groups.length === 0 && (
                  <div className="text-sm text-slate-500 p-3">
                    No issues found.
                  </div>
                )}
              </div>

              {/* details */}
              <div className="col-span-2 overflow-auto space-y-6 pr-2">
                {groups.map((g) => {
                  if (expanded !== g.id) return null;
                  const groupVersion =
                    g.items[0]?.versionId ?? currentVersionId ?? "no-version";
                  return (
                    <section
                      key={g.id}
                      className="space-y-4"
                      aria-labelledby={`frame-${g.id}-title`}
                    >
                      {/* Frame header with divider */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {g.thumbnail ? (
                            <Image
                              src={g.thumbnail}
                              alt={`frame-${g.id}`}
                              width={96}
                              height={64}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-24 h-16 bg-neutral-100 dark:bg-neutral-800 rounded" />
                          )}
                          <div>
                            {(() => {
                              const headerIdx = frameIndexMap.get(g.id) ?? 0;
                              const headerLabel =
                                headerIdx === 0
                                  ? "All Frames"
                                  : `Frame ${headerIdx}`;
                              return (
                                <h3
                                  id={`frame-${g.id}-title`}
                                  className="text-lg font-semibold"
                                >
                                  {headerLabel}
                                </h3>
                              );
                            })()}
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {g.items.length} issue
                              {g.items.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Prev / Next controls */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={goPrev}
                              disabled={!canPrev}
                              aria-label="Previous frame"
                              className={`p-2 rounded ${
                                canPrev
                                  ? "hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                                  : "opacity-40 cursor-not-allowed"
                              }`}
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              onClick={goNext}
                              disabled={!canNext}
                              aria-label="Next frame"
                              className={`p-2 rounded ${
                                canNext
                                  ? "hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                                  : "opacity-40 cursor-not-allowed"
                              }`}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* visual divider */}
                      <div className="border-t border-slate-200 dark:border-neutral-800" />
                      {/* issues list for this frame */}
                      <div className="space-y-3">
                        {[...g.items]
                          .slice()
                          .sort((a, b) => {
                            const rank: Record<string, number> = {
                              high: 3,
                              medium: 2,
                              low: 1,
                            };
                            const aRank =
                              rank[(a.impactLevel ?? "medium").toLowerCase()] ??
                              2;
                            const bRank =
                              rank[(b.impactLevel ?? "medium").toLowerCase()] ??
                              2;
                            return bRank - aRank;
                          })
                          .map((w, idx) => (
                            <article
                              key={w.id ?? `${g.id}-issue-${idx}`}
                              className="p-4 rounded-lg border dark:border-neutral-800 bg-white/60 dark:bg-black/10"
                              data-version={w.versionId ?? groupVersion}
                              aria-labelledby={`${g.id}-issue-${idx}-title`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4
                                    id={`${g.id}-issue-${idx}-title`}
                                    className="text-sm font-semibold"
                                  >
                                    {w.element ?? "Issue"}
                                  </h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {w.description}
                                  </p>
                                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 font-mono">
                                    {/* This is versionId */}
                                    {/* Version: {w.versionId ?? groupVersion} */}
                                  </div>
                                </div>

                                {/* severity badge */}
                                {(() => {
                                  const sev = (
                                    w.impactLevel ?? "medium"
                                  ).toLowerCase();
                                  let badgeColor =
                                    "bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981]";
                                  if (sev === "high") {
                                    badgeColor =
                                      "bg-[#FF0000]/10 dark:bg-[#FF0000]/5 text-[#E11D48]";
                                  } else if (sev === "medium") {
                                    badgeColor =
                                      "bg-[#F59E0B]/10 dark:bg-[#F59E0B]/5 text-[#F59E0B]";
                                  }
                                  return (
                                    <span
                                      className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold uppercase ${badgeColor}`}
                                    >
                                      {w.impactLevel ?? "medium"}
                                    </span>
                                  );
                                })()}
                              </div>

                              {w.suggestion && (
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  {w.suggestion}
                                </div>
                              )}
                            </article>
                          ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
