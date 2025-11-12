import React, { useMemo, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  IconHistory,
  IconSearch,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconSend,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  AlignEndHorizontal,
  BarChart2,
  Columns,
  Cpu,
  Menu,
  MessageSquare,
} from "lucide-react";
import CommentModal from "./CommentModal";
import { Comment } from "@/components/comments-user";
import { Design, Versions } from "../page";
import PublishConfirmModal from "./PublishConfirmModal";
import ImprovementGraphs from "./ImprovementGraphs";
import WeaknessesModal, { IWeakness } from "./WeaknessesModal";
import { flushSync } from "react-dom";
import ComputationalBreakdown from "./ComputationalBreakdownModal";
import HeuristicLegendModal from "./HeuristicLegendModal";
import { getHeuristicLegendFromVersion } from "@/database/actions/versions/heuristicLegend";

interface DesignHeaderActionsProps {
  handleShowVersions: () => void;
  handleOpenComments: () => void;
  showComments: boolean;
  setShowComments: (show: boolean) => void;
  comments: Comment[];
  loadingComments: boolean;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showSortOptions: boolean;
  setShowSortOptions: (show: boolean) => void;
  sortOrder: "default" | "asc" | "desc";
  setSortOrder: (order: "default" | "asc" | "desc") => void;
  sortRef: React.RefObject<HTMLDivElement | null>;
  design: Design;
  selectedVersion: Versions | null;
  publishProject: () => Promise<void>;
  unpublishProject: () => Promise<void>;
  syncPublishedState: () => Promise<void>;
  fetchWeaknesses?: (
    designId?: string | null,
    versionId?: string | null
  ) => Promise<void>;
  weaknesses?: IWeakness[];
  loadingWeaknesses?: boolean;
  displayVersionToShow?: string | null;
  allVersions: Versions[];
  onToggleCompare?: () => void;
  compareActive?: boolean;
  canCompare?: boolean;
  compareWhy?: string | null;
}

const DesignHeaderActions: React.FC<DesignHeaderActionsProps> = ({
  handleShowVersions,
  handleOpenComments,
  showComments,
  setShowComments,
  comments,
  loadingComments,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  showSortOptions,
  setShowSortOptions,
  sortOrder,
  setSortOrder,
  sortRef,
  design,
  selectedVersion,
  publishProject,
  unpublishProject,
  syncPublishedState,
  fetchWeaknesses,
  weaknesses,
  loadingWeaknesses,
  allVersions,
  onToggleCompare,
  compareActive,
  canCompare,
  compareWhy
}) => {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  const [evaluations, setEvaluations] = useState<
    { timestamp: string; score: number }[]
  >([]);
  const [displayVersionToShow, setDisplayVersionToShow] = useState<
    string | null
  >(null);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  //   const [weaknesses, setWeaknesses] = useState<any[]>([]);
  //   const [loadingWeaknesses, setLoadingWeaknesses] = useState(false);
  const [showWeaknesses, setShowWeaknesses] = useState(false);
  const [showComputationalBreakdown, setShowComputationalBreakdown] =
    useState(false);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [breakdownFrames, setBreakdownFrames] = useState<
    {
      id: string;
      name?: string;
      ai?: {
        overall_score?: number;
        category_scores?: any;
        heuristic_breakdown?: any[];
      };
    }[]
  >([]);

  const [showHeuristicLegend, setShowHeuristicLegend] = useState(false);
  const [heuristicLegend, setHeuristicLegend] = useState<any[]>([]);
  const [loadingLegend, setLoadingLegend] = useState(false);

  // const router = useRouter();

  const handlePublishConfirm = async () => {
    setShowPublishModal(false);
    await publishProject();
    await syncPublishedState();
  };

  const handleUnpublishConfirm = async () => {
    setShowPublishModal(false);
    await unpublishProject();
    await syncPublishedState();
  };

  async function markCommentAsRead(id: string) {
    const supabase = createClient();
    await supabase.from("comments").update({ is_read: true }).eq("id", id);
    // TODO: refresh comments here
  }
  async function markCommentAsUnread(id: string) {
    const supabase = createClient();
    await supabase.from("comments").update({ is_read: false }).eq("id", id);
    // TODO: refresh comments here
  }

  // Fetch evaluations (total_score from design_versions)
    const fetchEvaluations = React.useCallback(async () => {
    if (!design?.id) return;
    setLoadingEvaluations(true);

    const supabase = createClient();
    console.groupCollapsed("[DesignHeader] fetchEvaluations");
    console.log("designId:", design.id);
    const { data, error } = await supabase
      .from("design_versions")
      .select("id, version, thumbnail_url, total_score, created_at")
      .eq("design_id", design.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("design_versions query failed:", error.message);
      setEvaluations([]);
    } else {
      console.log("rows fetched:", (data ?? []).length);
      try {
        console.table(
          (data ?? []).map((r: any) => ({
            id: r.id,
            version: r.version,
            total_score: Number(r.total_score) ?? null,
            created_at: r.created_at,
          }))
        );
      } catch {}
      const mapped = (data ?? []).map((r: any) => ({
        timestamp: r.created_at ?? new Date().toISOString(),
        score: Number(r.total_score) ?? 0,
      }));
      setEvaluations(mapped);
    }
    console.groupEnd();
    setLoadingEvaluations(false);
  }, [design?.id]);

  const fetchLatestVersionNumber = async (did?: string | null) => {
    if (!did) return null;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("design_versions")
        .select("version")
        .eq("design_id", did)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn("fetchLatestVersionNumber failed", error.message);
        return null;
      }
      return data ? String(data.version) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Get the latest design_versions.id (UUID) for a design
  const fetchLatestVersionId = async (did?: string | null) => {
    if (!did) return null;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("design_versions")
        .select("id")
        .eq("design_id", did)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn("fetchLatestVersionId failed", error.message);
        return null;
      }
      return data?.id ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  function normalizeEntries(raw: any) {
    if (raw === null) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "object") {
      const keys = Object.keys(raw);
      if (keys.length && keys.every((k) => /^\d+$/.test(k)))
        return Object.values(raw);
      return [raw];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }

  const fetchFramesForBreakdown = async (
    designId?: string | null,
    versionId?: string | null
  ) => {
    const did = designId ?? design?.id ?? null;
    if (!did) return [];
    const supabase = createClient();

    console.groupCollapsed("[fetchFramesForBreakdown] start");
    console.log(
      "designId:",
      did,
      "requested versionId:",
      versionId,
      "selectedVersionId:",
      selectedVersion?.id
    );

    let vid: string | null =
      versionId ?? selectedVersion?.id ?? design?.current_version_id ?? null;

    // Ensure we have a UUID. If missing, fetch latest UUID.
    if (!vid) {
      vid = await fetchLatestVersionId(did);
      console.log("resolved latest versionId (uuid):", vid);
    }
    // If vid looks like a plain number (e.g., "1"), convert it to the UUID id.
    if (vid && /^\d+$/.test(vid)) {
      console.warn(
        "[fetchFramesForBreakdown] numeric version detected, resolving to UUID:",
        vid
      );
      const { data: vrow, error: verr } = await supabase
        .from("design_versions")
        .select("id")
        .eq("design_id", did)
        .eq("version", Number(vid))
        .maybeSingle();
      if (verr) {
        console.error(
          "[fetchFramesForBreakdown] failed to resolve version UUID:",
          verr.message
        );
        console.groupEnd();
        return [];
      }
      vid = vrow?.id ?? null;
      console.log("[fetchFramesForBreakdown] resolved version UUID:", vid);
    }

    if (!vid) {
      console.error("[fetchFramesForBreakdown] no version id resolved");
      console.groupEnd();
      return [];
    }

    const { data: frames, error } = await supabase
      .from("design_frame_evaluations")
      .select("id, ai_data, thumbnail_url, version_id, node_id")
      .eq("design_id", did)
      .eq("version_id", vid)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "[fetchFramesForBreakdown] frames query error:",
        error.message
      );
      console.groupEnd();
      return [];
    }

    console.log("frames rows:", (frames ?? []).length);
    try {
      console.table(
        (frames ?? []).map((f: any) => ({
          id: f.id,
          node_id: f.node_id,
          has_ai_data: !!f.ai_data,
          version_id: f.version_id,
        }))
      );
    } catch {}

    const out: any[] = [];
    for (const f of frames || []) {
      if (!f?.ai_data) {
        console.warn(
          "[fetchFramesForBreakdown] missing ai_data for frame:",
          f?.id || f?.node_id
        );
        out.push({ id: f.node_id || f.id, ai: {} });
        continue;
      }
      try {
        console.log(
          "[fetchFramesForBreakdown] parsing ai_data for frame:",
          f.id
        );
        const entries = normalizeEntries(
          typeof f.ai_data === "string" ? JSON.parse(f.ai_data) : f.ai_data
        );
        const entry = entries[0] ?? {};
        const root = entry?.ai ?? entry;

        // Optional: quick peek at heuristic codes
        const hb = Array.isArray(root?.heuristic_breakdown)
          ? root.heuristic_breakdown.map((h: any) => h?.code).filter(Boolean)
          : [];
        console.log(
          "[fetchFramesForBreakdown] heuristic codes:",
          f.node_id || f.id,
          hb
        );

        out.push({
          id: f.node_id || f.id,
          ai: {
            overall_score: root?.overall_score,
            category_scores: root?.category_scores,
            heuristic_breakdown: root?.heuristic_breakdown,
            debug_calc: root?.debug_calc,
          },
        });
      } catch (e) {
        console.error(
          "[fetchFramesForBreakdown] parse ai_data failed:",
          f.id,
          e
        );
        out.push({ id: f.node_id || f.id, ai: {} });
      }
    }

    console.log("[fetchFramesForBreakdown] parsed frames:", out.length);
    if (out.length) {
      console.log("[fetchFramesForBreakdown] sample entry:", out[0]);
    }
    console.groupEnd();
    return out;
  };

  const totalIters = Math.max(
    3,
    Math.min(
      5,
      Number((selectedVersion as any)?.snapshot?.totalIterations) || 3
    )
  );
  const iterClamped = Math.max(
    1,
    Math.min(totalIters, Number(selectedVersion?.version) || 1)
  );

  // Fetch weaknesses from latest version  frame evaluation
  //   const loadWeaknesses = React.useCallback(
  //     async (designId?: string | null, versionId?: string | null) => {
  //       const did = designId ?? design?.id ?? null;
  //       setLoadingWeaknesses(true);

  //       if (!did) {
  //         console.warn("fetchWeaknesses: missing designId - aborting");
  //         setLoadingWeaknesses(false);
  //         return;
  //       }

  //       try {
  //         const supabase = createClient();

  //         let vid = versionId ?? design?.current_version_id ?? null;
  //         if (!vid) {
  //           const { data: latest, error: latestError } = await supabase
  //             .from("design_versions")
  //             .select("id, thumbnail_url, ai_data, created_at")
  //             .eq("design_id", did)
  //             .order("created_at", { ascending: false })
  //             .limit(1)
  //             .maybeSingle();
  //           if (latestError)
  //             console.warn(
  //               "fetchWeaknesses: latest version lookup failed",
  //               latestError
  //             );
  //           vid = latest?.id ?? null;
  //         }

  //         if (!vid) {
  //           console.warn("fetchWeaknesses: no version found for design", did);
  //           setWeaknesses([]);
  //           return;
  //         }

  //         // load version row + frame evaluations for that version
  //         const vPromise = supabase
  //           .from("design_versions")
  //           .select("id, thumbnail_url, ai_data, created_at")
  //           .eq("id", vid)
  //           .maybeSingle();

  //         const fPromise = supabase
  //           .from("design_frame_evaluations")
  //           .select("id, ai_data, thumbnail_url, version_id, node_id")
  //           .eq("design_id", did)
  //           .eq("version_id", vid)
  //           .order("created_at", { ascending: true });

  //         const [
  //           { data: versionData, error: vError },
  //           { data: frames, error: fError },
  //         ] = await Promise.all([vPromise, fPromise]);

  //         if (vError)
  //           console.warn("fetchWeaknesses: version query error", vError);
  //         if (fError) console.warn("fetchWeaknesses: frames query error", fError);
  //         //  console.error("fetchWeaknesses: vid=", vid, "versionData.id=", versionData?.id, "framesCount=", Array.isArray(frames) ? frames.length : 0);

  //         const collected: any[] = [];

  //         // helper: normalize server shapes -> array of entries
  //         const normalizeEntries = (raw: any) => {
  //           if (raw == null) return [];
  //           if (Array.isArray(raw)) return raw;
  //           // sometimes JSON stored as object with numeric keys: { "0": {...}, "1": {...} }
  //           if (typeof raw === "object") {
  //             const keys = Object.keys(raw);
  //             if (keys.length && keys.every((k) => /^\d+$/.test(k)))
  //               return Object.values(raw);
  //             // fallback: single object
  //             return [raw];
  //           }
  //           // string fallback (shouldn't happen here)
  //           try {
  //             const parsed = JSON.parse(raw);
  //             return Array.isArray(parsed) ? parsed : [parsed];
  //           } catch {
  //             return [];
  //           }
  //         };

  //         // parse version-level ai_data (supports nested `ai`, arrays, numeric-key objects)
  //         if (versionData?.ai_data) {
  //           try {
  //             const parsed =
  //               typeof versionData.ai_data === "string"
  //                 ? JSON.parse(versionData.ai_data)
  //                 : versionData.ai_data;
  //             const entries = normalizeEntries(parsed);
  //             entries.forEach((entry: any) => {
  //               const root = entry?.ai ?? entry;
  //               if (Array.isArray(root?.weaknesses)) {
  //                 collected.push(
  //                   ...root.weaknesses.map((it: any) => ({
  //                     ...(it || {}),
  //                     frameId: "version-global",
  //                     versionId: versionData.id,
  //                     thumbnail_url:
  //                       it?.thumbnail_url ?? versionData.thumbnail_url,
  //                   }))
  //                 );
  //               }
  //               if (Array.isArray(root?.issues)) {
  //                 collected.push(
  //                   ...root.issues.map((it: any) => ({
  //                     ...(it || {}),
  //                     frameId: "version-global",
  //                     versionId: versionData.id,
  //                     thumbnail_url:
  //                       it?.thumbnail_url ?? versionData.thumbnail_url,
  //                   }))
  //                 );
  //               }
  //             });
  //           } catch (e) {
  //             console.warn("fetchWeaknesses: failed to parse version ai_data", e);
  //           }
  //         }

  //         // parse each frame evaluation's ai_data and attach metadata (frame-level)
  //         if (Array.isArray(frames) && frames.length) {
  //           frames.forEach((f: any) => {
  //             if (!f?.ai_data) return;
  //             try {
  //               const parsed =
  //                 typeof f.ai_data === "string"
  //                   ? JSON.parse(f.ai_data)
  //                   : f.ai_data;
  //               const entries = normalizeEntries(parsed);
  //               entries.forEach((entry: any) => {
  //                 const root = entry?.ai ?? entry;
  //                 const attachMeta = (item: any) => {
  //                   const nodeFromItem =
  //                     item?.frameId ?? item?.node_id ?? item?.nodeId ?? f.node_id;
  //                   const normalizedFrameId = nodeFromItem ?? `eval-${f.id}`;
  //                   return {
  //                     ...(item || {}),
  //                     frameId: normalizedFrameId,
  //                     frameEvalId: f.id,
  //                     thumbnail_url: f.thumbnail_url ?? item?.thumbnail_url,
  //                     versionId: f.version_id ?? vid,
  //                   };
  //                 };
  //                 if (Array.isArray(root?.weaknesses))
  //                   collected.push(...root.weaknesses.map(attachMeta));
  //                 if (Array.isArray(root?.issues))
  //                   collected.push(...root.issues.map(attachMeta));
  //               });
  //             } catch (e) {
  //               console.warn(
  //                 "fetchWeaknesses: failed to parse frame ai_data",
  //                 f.id,
  //                 e
  //               );
  //             }
  //           });
  //         }

  //         // dedupe by frame + id/message
  //         const uniq: any[] = [];
  //         const seen = new Set<string>();
  //         collected.forEach((w: any) => {
  //           const framePart =
  //             w.frameId ?? w.frameEvalId ?? w.node_id ?? "frame:global";
  //           const key = `${framePart}::${w.id ?? w.message ?? JSON.stringify(w)}`;
  //           if (!seen.has(key)) {
  //             seen.add(key);
  //             uniq.push(w);
  //           }
  //         });

  //         console.debug(
  //           "fetchWeaknesses: collected, uniq counts:",
  //           collected.length,
  //           uniq.length
  //         );
  //         setWeaknesses(uniq);
  //       } catch (err) {
  //         console.error("Failed to fetch weaknesses (merged):", err);
  //         setWeaknesses([]);
  //       } finally {
  //         setLoadingWeaknesses(false);
  //       }
  //     },
  //     [design?.id, design?.current_version_id]
  //   );

  const extraTickvalues = useMemo(() => {
    return Array.from(
      new Set(
        evaluations.map((d) => Number(d.score)).filter((n) => !Number.isNaN(n))
      )
    ).sort((a, b) => a - b);
  }, [evaluations]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

    useEffect(() => {
    console.groupCollapsed("[DesignHeader] Props snapshot");
    console.log("design.id:", design?.id);
    console.log("selectedVersion:", {
      id: selectedVersion?.id,
      version: selectedVersion?.version,
      total_score: selectedVersion?.total_score,
    });
    console.log("allVersions count:", allVersions?.length);
    try {
      console.table(
        (allVersions || []).map((v) => ({
          id: v.id,
          version: v.version,
          total_score: v.total_score,
          created_at: v.created_at,
        }))
      );
    } catch {}
    console.log("compareActive:", compareActive, "canCompare:", canCompare);
    console.groupEnd();
  }, [design?.id, selectedVersion?.id, selectedVersion?.version, allVersions?.length, compareActive, 
    canCompare, allVersions, selectedVersion?.total_score]);

  console.warn("This is fetchingWeaknesses: ", fetchWeaknesses);
  return (
    <div className="flex gap-2 items-center justify-between">
      {/* Wrapper */}
      <div className="relative flex gap-2 items-center mr-18">
        <div className="relative group mr-2 mt-1">
          <button
            className="hover:text-[#ED5E20] transition cursor-pointer"
            onClick={() => {
              setShowSortOptions(false);
              setShowSearch(false);
              setShowComments(false);
              setShowPublishModal(true);
            }}
            aria-label="Publish"
          >
            {design.is_active ? (
              <div className="relative inline-flex items-center">
                <span className="absolute inline-flex h-6 w-6 rounded-full bg-green-400 opacity-65 animate-ping"></span>
                <IconSend
                  size={20}
                  className="relative z-10 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.7)] animate-pulse"
                />
              </div>
            ) : (
              <IconSend size={20} />
            )}
          </button>
          {/* Tooltip  */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              {design.is_active ? "Unpublish" : "Publish"}
            </div>
          </div>
          <PublishConfirmModal
            open={showPublishModal}
            onClose={() => setShowPublishModal(false)}
            onConfirm={
              design.is_active ? handleUnpublishConfirm : handlePublishConfirm
            }
            mode={design.is_active ? "unpublish" : "publish"}
          />
        </div>
        {/* Version History */}
        <div className="relative group">
          <button
            onClick={() => {
              setShowSortOptions(false);
              setShowSearch(false);
              setShowComments(false);
              setShowPublishModal(false);
              handleShowVersions();
            }}
            className="hover:text-[#ED5E20] transition cursor-pointer p-2 rounded"
            aria-label="Show Version History"
          >
            <IconHistory size={22} />
          </button>
          {/* Tooltip */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              Version History
            </div>
          </div>
        </div>
        {/* Comments */}
        <div className="relative group">
          <button
            className="cursor-pointer p-2 rounded hover:text-[#ED5E20] transition"
            aria-label="Show Comments"
            onClick={() => {
              setShowSortOptions(false);
              setShowSearch(false);
              setShowPublishModal(false);
              handleOpenComments();
            }}
          >
            <MessageSquare size={22} />
          </button>
          {/* Tooltip */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              Comments
            </div>
          </div>
        </div>
        <CommentModal
          open={showComments}
          onClose={() => setShowComments(false)}
          comments={comments}
          loading={loadingComments}
          markCommentAsRead={markCommentAsRead}
          markCommentAsUnread={markCommentAsUnread}
        />
        {/* SEARCH */}
        <div className="relative group">
          <button
            className="cursor-pointer p-2 rounded hover:text-[#ED5E20] transition"
            aria-label="Search"
            onClick={() => {
              setShowSortOptions(false);
              setShowComments(false);
              setShowPublishModal(false);
              setShowSearch(!showSearch);
            }}
          >
            <IconSearch size={20} />
          </button>
          {/* Tooltip */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              Search
            </div>
          </div>
          {/* Popover */}
          {showSearch && (
            <div
              className="absolute left-1/2 top-full mt-3 -translate-x-1/2 z-30 w-72 rounded-xl shadow-2xl border border-[#ED5E20]/20
                            bg-white/80 dark:bg-[#232323]/80 backdrop-blur-lg animate-fade-in-up transition-all duration-300"
              style={{
                boxShadow:
                  "0 8px 32px 0 rgba(237,94,32,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.08)",
              }}
            >
              {/* Input with icon */}
              <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                <IconSearch size={18} className="text-[#ED5E20] opacity-80" />
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded border focus:border-[#ED5E20] focus:ring-2 focus:ring-[#ED5E20]/20 outline-none bg-white/80 dark:bg-[#232323]/80 transition"
                  placeholder="Search frames…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="px-4 pb-4">
                <button
                  className="mt-2 w-full bg-gradient-to-r from-[#ED5E20] 
                                    cursor-pointer
                                    to-orange-400 text-white rounded py-1 font-semibold shadow hover:from-orange-500 hover:to-[#ED5E20] transition"
                  onClick={() => setShowSearch(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
        {/* SORT */}
        <div ref={sortRef} className="relative group">
          <button
            className={`flex items-center justify-center rounded-full cursor-pointer transition
                        ${
                          showSortOptions
                            ? "ring-2 ring-[#ED5E20] bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 shadow"
                            : ""
                        }
                        hover:bg-[#ED5E20]/15 hover:text-[#ED5E20] focus:ring-2 focus:ring-[#ED5E20]`}
            tabIndex={0}
            onClick={() => {
              setShowSearch(false);
              setShowComments(false);
              setShowPublishModal(false);
              setShowSortOptions(!showSortOptions);
            }}
            type="button"
          >
            <IconFilter size={22} className="text-inherit" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              Sort Options
            </div>
          </div>
          {/* Sort Buttons Dropdown */}
          {showSortOptions && (
            <div
              className="absolute left-1/2 top-full mt-3 -translate-x-1/2 flex flex-col gap-2 bg-white dark:bg-[#232323] border border-[#ED5E20]/30 rounded-xl shadow-2xl p-3 z-30 min-w-[180px] animate-fade-in-up"
              tabIndex={-1}
              style={{
                transition: "box-shadow 0.2s, border 0.2s",
                boxShadow:
                  "0 8px 32px 0 rgba(237,94,32,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.08)",
              }}
            >
              <div className="mb-2 px-2 text-xs font-semibold text-[#ED5E20] tracking-widest uppercase opacity-80 select-none">
                Sort Frames By
              </div>
              {/* Ascending */}
              <button
                onClick={() => {
                  setSortOrder("asc");
                  setShowSortOptions(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base cursor-pointer font-medium transition
                                    ${
                                      sortOrder === "asc"
                                        ? "bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 text-[#ED5E20] shadow-md scale-105"
                                        : "bg-gray-100 dark:bg-[#232323] text-gray-700 dark:text-gray-200 hover:bg-[#ED5E20]/10 hover:text-[#ED5E20]"
                                    }group`}
                aria-label="Sort by Lowest Score"
              >
                <span className="transition-transform group-hover:-translate-y-1 group-hover:scale-110">
                  <IconSortAscending size={22} />
                </span>
                Lowest Score
              </button>
              {/* Descending */}
              <button
                onClick={() => {
                  setSortOrder("desc");
                  setShowSortOptions(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition cursor-pointer
                                    ${
                                      sortOrder === "desc"
                                        ? "bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 text-[#ED5E20] shadow-md scale-105"
                                        : "bg-gray-100 dark:bg-[#232323] text-gray-700 dark:text-gray-200 hover:bg-[#ED5E20]/10 hover:text-[#ED5E20]"
                                    } group`}
                aria-label="Sort by Highest Score"
              >
                <span className="transition-transform group-hover:-translate-y-1 group-hover:scale-110">
                  <IconSortDescending size={22} />
                </span>
                Highest Score
              </button>
              {/* Default */}
              <button
                onClick={() => {
                  setSortOrder("default");
                  setShowSortOptions(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition cursor-pointer
                                    ${
                                      sortOrder === "default"
                                        ? "bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 text-[#ED5E20] shadow-md scale-105"
                                        : "bg-gray-100 dark:bg-[#232323] text-gray-700 dark:text-gray-200 hover:bg-[#ED5E20]/10 hover:text-[#ED5E20]"
                                    } group`}
                aria-label="Default Order"
              >
                <span className="transition-transform group-hover:-translate-y-1 group-hover:scale-110">
                  <Menu size={22} />
                </span>
                Default Order
              </button>
            </div>
          )}
        </div>

        {/* Showing improvement */}
        <div className="relative group">
          <button
            className={`p-2 rounded cursor-pointer transition
                    ${
                      showGraphs
                        ? "ring-2 ring-[#ED5E20] bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 shadow"
                        : ""
                    }
                 hover:text-[#ED5E20] ${
                   loadingEvaluations ? "opacity-60 pointer-events-none" : ""
                 }`}
            aria-label="Show improvement graphs"
            disabled={loadingEvaluations}
            onClick={async () => {
              // Close other UI panels when toggling graphs
              setShowSortOptions(false);
              setShowSearch(false);
              setShowComments(false);
              setShowPublishModal(false);

              if (!showGraphs) {
                // fetch first, then mount the graphs — prevents a remount flash / cut-off animation
                try {
                  await fetchEvaluations();
                } catch (e) {
                  console.error("fetchEvaluations failed:", e);
                }
                setShowGraphs(true);
              } else {
                // closing the graph
                setShowGraphs(false);
              }
            }}
          >
            <BarChart2 size={18} className="text-inherit" />
          </button>

          {/* Tooltip */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              Improvement Graphs
            </div>
          </div>
        </div>

        <div className="relative group">
          <button
            className="p-2 rounded cursor-pointer transition hover:text-[#ED5E20]"
            aria-label="Show Weaknesses"
            onClick={async () => {
              setShowSortOptions(false);
              setShowSearch(false);
              setShowComments(false);
              setShowPublishModal(false);

              const vid = selectedVersion?.id ?? null;

              // immediate best-guess display value (no network)
              let display: string | null = null;
              if (selectedVersion?.version != null) {
                display = String(selectedVersion.version);
              } else if (selectedVersion?.id) {
                const digits = String(selectedVersion.id)
                  .match(/\d+/g)
                  ?.join("");
                display = digits ?? String(selectedVersion.id);
              }

              // If we don't have a reliable display, fetch it first to avoid flicker
              if (!display) {
                try {
                  const fetched = await fetchLatestVersionNumber(design.id);
                  if (fetched) display = fetched;
                } catch (e) {
                  console.error("failed to prefetch version:", e);
                }
              }

              // force parent state update synchronously so modal receives prop immediately
              flushSync(() => {
                setDisplayVersionToShow(display ?? null);
              });
              setShowWeaknesses(true);

              // still fetch weaknesses in background
              (async () => {
                try {
                  await fetchWeaknesses?.(design.id, vid);
                } catch (e) {
                  console.error("background weakness fetch failed:", e);
                }
              })();
            }}
          >
            <IconAlertTriangle size={18} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              Weaknesses
            </div>
          </div>
        </div>

        {/* Add Computational Breakdown button */}
        <div className="relative group">
          <button
            className="p-2 rounded cursor-pointer transition hover:text-[#ED5E20]"
            aria-label="Show Computational Breakdown"
            onClick={async () => {
              setShowSortOptions(false);
              setShowSearch(false);
              setShowComments(false);
              setShowPublishModal(false);
              setShowWeaknesses(false);
              setShowGraphs(false);

              // load frames then open
              try {
                setLoadingBreakdown(true);
                const frames = await fetchFramesForBreakdown(
                  design.id,
                  selectedVersion?.id ?? null
                );
                console.log(
                  "[ComputationalBreakdown] frames fetch: ",
                  frames.length
                );
                setBreakdownFrames(frames);
              } catch (e) {
                console.error("[ComputationalBreakdown] fetch failed: ", e);
              } finally {
                setLoadingBreakdown(false);
                setShowComputationalBreakdown(true);
              }
            }}
          >
            <Cpu size={18} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              Computational Breakdown
            </div>
          </div>
        </div>

        {/* Heuristic Legend */}
        <div className="relative group">
          <button
            className="p-2 rounded cursor-pointer transition hover:text-[#ED5E20]"
            aria-label="Show Heuristic Legend"
            onClick={async () => {
              setShowSortOptions(false);
              setShowSearch(false);
              setShowComments(false);
              setShowPublishModal(false);
              setShowWeaknesses(false);
              setShowGraphs(false);
              setShowComputationalBreakdown(false);
              try {
                setLoadingLegend(true);

                // Resolve a usable version UUID:
                let vid: string | null =
                  selectedVersion?.id ??
                  (design?.current_version_id as string | null) ??
                  null;

                // If a plain number sneaks in, resolve it to UUID
                if (vid && /^\d+$/.test(String(vid))) {
                  const supabase = createClient();
                  const { data } = await supabase
                    .from("design_versions")
                    .select("id")
                    .eq("design_id", design.id)
                    .eq("version", Number(vid))
                    .maybeSingle();
                  vid = data?.id ?? null;
                }

                // Fallback to latest version UUID
                if (!vid) {
                  vid = await fetchLatestVersionId(design.id);
                }

                const legend = vid
                  ? await getHeuristicLegendFromVersion(vid)
                  : [];

                // In the place you set legend
                console.log(
                  "[Legend raw ai_data]",
                  typeof selectedVersion?.ai_data,
                  selectedVersion?.ai_data
                );
                console.log("[Legend extracted]", legend);
                setHeuristicLegend(legend);
              } catch (e) {
                console.error("[Heuristic Legend] fetch failed: ", e);
              } finally {
                setLoadingLegend(false);
                setShowHeuristicLegend(true);
              }
            }}
          >
            <AlignEndHorizontal size={18} />
          </button>
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              Heuristic Breakdown
            </div>
          </div>
        </div>

        {/* Compare Versions */}
        <div className="relative group">
          <button
            className={`p-2 rounded cursor-pointer transition
              ${
                compareActive
                  ? "ring-2 ring-[#ED5E20] bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 shadow"
                  : ""
              }
              hover:text-[#ED5E20]
              ${!canCompare ? "opacity-40 pointer-events-none" : ""}`}
            aria-label="Toggle version comparison"
            disabled={!canCompare}
            onMouseEnter={() => {
              console.groupCollapsed("[DesignHeader] Compare availability (hover)");
              console.log("canCompare:", canCompare, "reason:", compareWhy || "(none)");
              console.log("allVersions count:", allVersions?.length);
              console.log("selectedVersion:", { id: selectedVersion?.id, version: selectedVersion?.version });
              console.log("design.current_version_id:", design?.current_version_id);
              console.groupEnd();
            }}
            onFocus={() => {
              // Keyboard users
              console.groupCollapsed("[DesignHeader] Compare availability (focus)");
              console.log("canCompare:", canCompare, "reason:", compareWhy || "(none)");
              console.groupEnd();
            }}
            onClick={() => {
              // Will only fire if canCompare is true
              setShowSortOptions(false);
              setShowSearch(false);
              setShowComments(false);
              setShowPublishModal(false);
              onToggleCompare?.();
            }}
          >
            <Columns size={18} className="text-inherit" />
          </button>
        
          {/* Tooltip */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
              {canCompare
                ? (compareActive ? "Exit Comparison" : "Compare Versions")
                : (compareWhy || "Need at least 2 versions")}
            </div>
          </div>
        </div>

        {/* Render detached modal centered when open */}
        {showGraphs && (
          <ImprovementGraphs
            evaluations={evaluations}
            onClose={() => setShowGraphs(false)}
            extraTickValues={extraTickvalues}
          />
        )}
        {showWeaknesses && (
          <WeaknessesModal
            key={displayVersionToShow ?? "weaknesses-modal"}
            open={showWeaknesses}
            onClose={() => setShowWeaknesses(false)}
            weaknesses={weaknesses ?? []}
            // versionIdToShow={selectedVersion?.id ?? null}
            // New prop: already-resolved/displayable version string (avoids modal flicker)
            displayVersionToShow={displayVersionToShow}
            onApplyFixes={async () => {
              // TODO: implement apply fixes logic
            }}
            onRecheck={async () => {
              await fetchWeaknesses?.(
                design.id,
                selectedVersion?.id ?? design?.current_version_id ?? null
              );
            }}
            fetchWeaknesses={fetchWeaknesses}
            designId={design.id}
            allVersions={allVersions}
          />
        )}

        {/* ADDING here the computational breakdown for good measure */}
        {showComputationalBreakdown && (
          <ComputationalBreakdown
            open={showComputationalBreakdown}
            onClose={() => setShowComputationalBreakdown(false)}
            frames={breakdownFrames}
            initialFrameId={breakdownFrames[0]?.id}
            loading={loadingBreakdown}
            iteration={iterClamped}
            totalIterations={totalIters}
          />
        )}

        {showHeuristicLegend && (
          <HeuristicLegendModal
            open={showHeuristicLegend}
            onClose={() => setShowHeuristicLegend(false)}
            loading={loadingLegend}
            items={heuristicLegend}
            versionLabel={selectedVersion?.version ?? null}
          />
        )}
      </div>
    </div>
  );
};

export default DesignHeaderActions;
