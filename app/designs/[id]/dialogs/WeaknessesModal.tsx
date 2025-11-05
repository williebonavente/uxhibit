// ...existing code...
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  X,
  Zap,
} from "lucide-react";
import React, { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Versions } from "../page";

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
  fetchWeaknesses?: (
    designId?: string | null,
    versionId?: string | null
  ) => Promise<void>;
  designId?: string | null;
  allVersions?: Versions[];
}

export default function WeaknessesModal({
  open,
  onClose,
  weaknesses,
  versionIdToShow = null,
  displayVersionToShow,
  onApplyFixes,
  onRecheck,
  fetchWeaknesses,
  designId,
  allVersions,
}: Props) {
  // initialize from parent-provided displayVersionToShow to avoid flicker
  const [displayVersionNumber, setDisplayVersionNumber] = useState<
    string | null
  >(() => displayVersionToShow ?? null);

  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolving, setResolving] = useState<boolean>(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const pendingMood: "red" | "yellow" = "red";

  const toggleResolved = (id: string) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  const weaknessList = useMemo<IWeakness[]>(
    () => weaknesses ?? [],
    [weaknesses]
  );

  // generate stable, deterministic keys using a source index when available.
  // fallback uses a per-base counter to ensure uniqueness across items without ids.
  const idCountersRef = useRef<Map<String, number>>(new Map());
  const stableId = (w: IWeakness) => {
    const base =
      w.id ??
      `${w.versionId ?? w.frameId ?? "ungrouped"}-${String(
        w.element ?? "issue"
      ).replace(/\s+/g, "_")}`;

    const srcIdx = (w as any).__srcIndex;
    if (typeof srcIdx === "number") return `${base}-${srcIdx};`;
    const counters = idCountersRef.current;
    const count = counters.get(base) ?? 0;
    counters.set(base, count + 1);
    return `${base}-${count};`;
  };

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
    displayed.forEach((raw, srcIndex) => {
      const normalizedFrameId =
        (raw as any).frameId ??
        (raw as any).frameEvalId ??
        (raw as any).frame_id ??
        raw.node_id ??
        "ungrouped";
      // preserve a deterministic source index so stableId can produce unique stable keys
      const w: IWeakness = {
        ...(raw as any),
        frameId: normalizedFrameId,
        __srcIndex: srcIndex,
      } as any;
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

  const inferVersionIdFromList = (
    items: IWeakness[] | undefined,
    allVersions?: Versions[]
  ): string | null => {
    if (items && items.length > 0) {
      const ids = items.map((w) => w.versionId).filter(Boolean);
      if (ids.length > 0) {
        return ids[ids.length - 1] as string;
      }
    }
    // Fallback: return the latest version's id from allVersions if available
    if (Array.isArray(allVersions) && allVersions.length > 0) {
      const sorted = [...allVersions].sort(
        (a, b) => Number(b.version) - Number(a.version)
      );
      return String(sorted[0].id);
    }
    return null;
  };

  // show which version the modal is currently displaying
  // prefer explicit versionIdToShow, otherwise infer from displayed items
  const currentVersionId = useMemo((): string | null => {
    if (versionIdToShow) return versionIdToShow;
    if (!displayed || displayed.length === 0) return null;
    const found = (displayed as any[]).find((w) => (w as any).versionId);
    return found?.versionId ?? (displayed[0] as any)?.versionId ?? null;
  }, [versionIdToShow, displayed]);

  // Find the selected version object
  const selectedVersionObj = allVersions?.find(
    (v) => String(v.id) === String(displayVersionNumber)
  );

  const selectedVersionId = inferVersionIdFromList(weaknesses, allVersions);

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
      inferVersionIdFromList(weaknesses) ??
      null;
    if (immediate && immediate !== displayVersionNumber) {
      setDisplayVersionNumber(String(immediate));
    }
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
            .select("id, version")
            .eq("id", idLike)
            .maybeSingle();
          if (q.data && !q.error) return String(q.data.id);
          // if numeric-like, use numeric
          const asNum = Number(idLike);
          if (!Number.isNaN(asNum)) return String(asNum);
          // try by version value
          q = await supabase
            .from("design_versions")
            .select("id, version")
            .eq("version", idLike)
            .maybeSingle();
          if (q.data && !q.error) return String(q.data.id);
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
          .select("id, version")
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

  useEffect(() => {
    if (
      open &&
      Array.isArray(allVersions) &&
      allVersions.length > 0 &&
      !displayVersionNumber
    ) {
      setDisplayVersionNumber(String(allVersions[0].id));
    }
  }, [open, allVersions, displayVersionNumber]);

  const visibleVersion =
    displayVersionNumber ??
    inferVersionIdFromList(weaknesses) ??
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

  const applyFixesForFrame = async (frameId: string, items: IWeakness[]) => {
    if (resolving) return;
    setResolving(true);
    try {
      await onApplyFixes?.({ frameId });
      setResolvedIds((prev) => {
        const next = new Set(prev);
        items.forEach((w) => next.add(stableId(w)));
        return next;
      });
    } catch (err) {
      console.error("applyFixesForFrame error:", err);
    } finally {
      setResolving(false);
    }
  };

  // revert fixes for a whole frame (mark resolved items as pending)
  const revertFixesForFrame = async (frameId: string, items: IWeakness[]) => {
    if (resolving) return;
    setResolving(true);
    try {
      // optional: could call an API to revert; here we update local state to "re-open" items
      setResolvedIds((prev) => {
        const next = new Set(prev);
        items.forEach((w) => next.delete(stableId(w)));
        return next;
      });
      // optionally trigger a recheck after revert
      await onRecheck?.({ frameId });
    } catch (err) {
      console.error("revertFixesForFrame error:", err);
    } finally {
      setResolving(false);
    }
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
            className="relative z-10 w-full max-w-7xl md:max-w-8xl lg:max-w-9xl max-h-[95vh] h-auto bg-white dark:bg-[#0b0b0b] rounded-2xl shadow-2xl p-6 flex flex-col overflow-auto"
          >
            <div className="flex items-center justify-between mb-4 w-full">
              {/* Left: Title and Version Selector */}
              <div className="flex items-center gap-6 min-w-0">
                <div className="flex flex-col min-w-0">
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
                        <div className="mb-1 text-sm font-mono text-slate-700 dark:text-slate-300">
                          {selectedVersionObj
                            ? `Version ${selectedVersionObj.version}`
                            : "Select a version"}
                        </div>
                      </div>
                      <Select
                        value={selectedVersionId ?? ""}
                        onValueChange={(val) => {
                          setDisplayVersionNumber(val);
                          if (designId) fetchWeaknesses?.(designId, val);
                        }}
                      >
                        <SelectTrigger className="w-24 font-mono font-semibold text-sm text-slate-900 dark:text-slate-100 bg-transparent border-none shadow-none focus:ring-0 focus:outline-none">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(allVersions)
                            ? allVersions
                                .slice()
                                .sort(
                                  (a, b) =>
                                    Number(b.version) - Number(a.version)
                                )
                                .map((ver) => (
                                  <SelectItem key={ver.id} value={ver.id}>
                                    {ver.version}
                                  </SelectItem>
                                ))
                            : []}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Pagination and Close Button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  className="absolute top-0 right-0 mt-2 mr-6 px-3 py-2 rounded border hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer z-10"
                  onClick={onClose}
                  aria-label="Close weaknesses modal"
                >
                  <X />
                </button>
              </div>
            </div>

            {/* Body: left = frames list, right = details */}
            <div className="flex-1 space-y-6">
              {groups.length === 0 ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="w-full flex flex-col items-center justify-center gap-4 py-12"
                >
                  <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-[#ECFDF5] to-[#BBF7D0] dark:from-[#064E3B]/30 dark:to-transparent flex items-center justify-center shadow-inner relative">
                    <Check
                      size={48}
                      className="text-[#059669] drop-shadow-lg animate-pulse"
                    />
                    <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-[#86efac] animate-pulse" />
                    <span className="absolute top-3 left-10 w-2 h-2 rounded-full bg-[#bbf7d0] animate-ping" />
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    No issues detected
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl text-center">
                    There are no weaknesses to show for the selected version or
                    frame. Try switching to another version.
                  </p>
                </div>
              ) : (
                groups
                  .filter((g) => expanded === null || g.id === expanded)
                  .map((g) => {
                    const groupVersion =
                      g.items[0]?.versionId ?? visibleVersion ?? "no-version";
                    const headerIdx = frameIndexMap.get(g.id) ?? 0;
                    const headerLabel =
                      headerIdx === 0 ? "All Frames" : `Frame ${headerIdx}`;

                    const pending = g.items.filter(
                      (w) => !resolvedIds.has(stableId(w))
                    );
                    const resolved = g.items.filter((w) =>
                      resolvedIds.has(stableId(w))
                    );

                    return (
                      <section
                        key={g.id}
                        className="rounded-lg border p-4 bg-white/50 dark:bg-black/5"
                        aria-labelledby={`frame-${g.id}-title`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between w-full">
                                <h3
                                  id={`frame-${g.id}-title`}
                                  className="text-lg font-semibold"
                                >
                                  {headerLabel}
                                </h3>

                                {/* Pagination (right-most) */}
                                <div className="flex items-center gap-2 ml-auto">
                                  <div className="flex items-center gap-3 px-2 py-1 rounded-md border bg-white/60 dark:bg-neutral-900/40 shadow-sm">
                                    <button
                                      onClick={goPrev}
                                      disabled={!canPrev}
                                      aria-label="Previous frame"
                                      className={`p-2 rounded-md ${
                                        canPrev
                                          ? "hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                                          : "opacity-40 cursor-not-allowed"
                                      }`}
                                    >
                                      <ChevronLeft size={20} />
                                    </button>
                                    {/* compact status with SVG ring */}
                                    <div className="flex items-center gap-2 px-2">
                                      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/70 dark:bg-neutral-900/40 border shadow-sm">
                                        <div className="text-sm font-mono text-slate-600 dark:text-slate-400">
                                          {`${Math.max(
                                            1,
                                            currentIndex + 1
                                          )} / ${groups.length}`}
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={goNext}
                                      disabled={!canNext}
                                      aria-label="Next frame"
                                      className={`p-2 rounded-md ${
                                        canNext
                                          ? "hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                                          : "opacity-40 cursor-not-allowed"
                                      }`}
                                    >
                                      <ChevronRight size={20} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                {/* <span className="font-mono">{g.items.length} total</span> */}

                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    pendingMood === "red"
                                      ? "bg-[#FEE2E2] text-[#DC2626] dark:bg-[#4B1F1F]/30"
                                      : "bg-[#FFEDD5] text-[#92400E] dark:bg-[#3F2B0D]/20"
                                  }`}
                                >
                                  {/* {pending.length} pending */}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500"></span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 items-start">
                          <div>
                            {/* Left: Thumbnail Column */}
                            <div className="flex flex-col items-center justify-center gap-3">
                              {g.thumbnail ? (
                                <div className="w-full flex items-center justify-center">
                                  <Image
                                    src={g.thumbnail}
                                    alt={`Frame ${headerLabel}`}
                                    width={420}
                                    height={240}
                                    className="rounded-lg object-cover border border-slate-200 dark:border-neutral-800 shadow-sm"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-48 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-slate-200 dark:border-neutral-700">
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    No preview available
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Issues Column (stylized header + body) */}
                          <div className="space-y-3">
                            {pending.length === 0 && (
                              <div
                                role="status"
                                aria-live="polite"
                                className="flex items-center gap-3 p-4 rounded-md border border-slate-200 dark:border-neutral-800 bg-white/60 dark:bg-black/20"
                              >
                                <div className="flex-shrink-0">
                                  <div className="flex-shrink-0">
                                    <div className="w-14 h-14 relative flex items-center justify-center">
                                      {/* subtle green background + inner glow */}
                                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ECFDF5] to-[#BBF7D0] dark:from-[#064E3B]/30 dark:to-transparent shadow-inner" />
                                      {/* greener check */}
                                      <Check
                                        size={22}
                                        className="relative text-[#059669] drop-shadow-sm"
                                      />
                                      {/* decorative sparkles */}
                                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#86efac] opacity-95 animate-pulse" />
                                      <span className="absolute top-0 left-3 w-1.5 h-1.5 rounded-full bg-[#bbf7d0] opacity-80 animate-ping" />
                                      <span className="absolute bottom-0.5 -left-1 w-1.5 h-1.5 rounded-full bg-[#bbf7d0] opacity-85 animate-pulse" />
                                    </div>
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    No pending issues
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    Everything in this frame looks good — nice
                                    work.
                                  </div>
                                </div>
                              </div>
                            )}

                            {pending.map((w) => {
                              const key = stableId(w);
                              const sev = (
                                w.impactLevel ?? "medium"
                              ).toLowerCase();
                              return (
                                <article
                                  key={key}
                                  className="p-3 rounded-lg border dark:border-neutral-800 bg-white/60 dark:bg-black/10 flex items-start gap-3"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="text-base font-semibold">
                                          {w.element ?? "Issue"}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                          {w.description}
                                        </div>
                                      </div>
                                      <div className="text-right ml-2">
                                      </div>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                      <strong>Suggestion:</strong>{" "}
                                      {w.suggestion ??
                                        "Provide a clear label, reduce steps, and improve affordance for this control."}
                                    </div>
                                  </div>
                                  <div>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                                        sev === "high"
                                          ? "bg-[#FF0000]/10 text-[#E11D48]"
                                          : sev === "medium"
                                          ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                                          : "bg-[#10B981]/10 text-[#10B981]"
                                      }`}
                                    >
                                      {w.impactLevel ?? "medium"}
                                    </span>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      </section>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
