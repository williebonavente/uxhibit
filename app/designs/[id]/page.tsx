"use client";

import React, { useMemo } from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import EvaluationResult from "./dialogs/EvaluationResult";
import FrameNavigator from "./dialogs/FrameNavigator";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import {
  fetchDesignVersions,
  deleteDesignVersion,
} from "@/database/actions/versions/versionHistory";

import { toast } from "sonner";
import VersionHistoryModal from "./dialogs/VersionHistoryModal";
import DesignHeaderActions from "./dialogs/DesignHeader";
import ZoomControls from "./dialogs/ZoomControls";
import { CommentsSection } from "./comments/page";
import { Comment } from "@/components/comments-user";
// import EvaluationParamsModal from "@/components/evaluation-params-modal";
import DesignHeaderTitle from "@/components/arrow-back-button";
import {
  handleEvalParamsSubmit,
  handleEvaluateWithParams,
} from "@/lib/reEvaluate/evaluationHandlers";
import { IWeakness } from "./dialogs/WeaknessesModal";
import {
  ArrowDownRight,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Minus,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DesignComparison } from "./dialogs/DesignComparison";

export interface FrameEvaluation {
  id: string;
  snapshot: string;
  design_id?: string;
  version_id?: string;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  owner_id: string;
  ai_summary: string;
  ai_data: {
    overall_score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    issues: {
      id: string;
      severity: "low" | "medium" | "high";
      message: string;
      suggestion: string;
    }[];
    category_scores: {
      color: number;
      layout: number;
      hierarchy: number;
      usability: number;
      typography: number;
      accessibility: number;
    };
  };
  created_at: string;
  updated_at: string;
  total_score: number;
}

export type Snapshot = {
  age: string;
  occupation: string;
  iteration?: number;
};

export type HeuristicBreakdownItem = {
  code: string;
  score: number;
  principle: string;
  max_points: number;
  justification?: string;
  evaluation_focus?: string;
};

export type Versions = {
  id: string;
  design_id: string;
  version: number;
  file_key: string;
  node_id: string;
  total_score: number;
  thumbnail_url: string;
  ai_summary: string;
  ai_data: string;
  snapshot: Snapshot;
  created_at: string;
};

type EvalResource = {
  issue_id: string;
  title: string;
  url: string;
  description: string;
};
export type Design = {
  is_active: boolean;
  id: string;
  project_name: string;
  fileKey?: string;
  nodeId?: string;
  imageUrl: string;
  thumbnail?: string;
  thumbnailPath?: string;
  snapshot: Snapshot;
  current_version_id: string;
  frames?: { id: string | number; name: string; [key: string]: any }[];
  published_version_id?: string;
  published_at?: string;
  figma_link?: string;
  owner_id: string;
};

export type EvaluateInput = {
  designId: string;
  fileKey: string;
  nodeId?: string;
  fallbackImageUrl?: string;
  snapshot?: Snapshot;
  url?: string;
  frameIds?: string[];
  versionId: string;
};

type AiDebugCalc = {
  heuristics_avg: number;
  categories_avg: number;
  combined: number;
  target: number;
  alpha: number;
  blended: number;
  final: number;
  iteration: number;
  total_iterations: number;
  extra_pull_applied: boolean;
  bias_weighted_overall: number;
  
};

type AiBiasParams = {
  params?: {
    focus?: string;
    device?: string;
    generation?: string;
    occupation?: string;
    strictness?: string;
  };
  categoryWeights?: Record<string, number>;
  weighted_overall?: number;
  severityMultipliers?: Record<string, number>;
}
export type EvalResponse = {
  nodeId: string;
  imageUrl: string;
  summary: string;
  heuristics: any;
  ai_status?: "ok" | "skipped";
  overall_score?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  issues?: {
    id: string;
    severity: string;
    message: string;
    suggestion: string;
  }[];
  category_scores?: Record<string, number> | null;
  resources?: EvalResource[];
  ai?: {
    overall_score?: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    issues?: {
      id: string;
      severity: string;
      message: string;
      suggestions: string;
    }[];
    weakness_suggestions?: {
      element: string;
      suggestion: string;
      priority: "low" | "medium" | "high";
    }[];
    category_scores?: Record<string, number>;
    category_score_justifications?: Record<string, string>;
    resources?: EvalResource[];
    heuristic_breakdown?: HeuristicBreakdownItem[];
    debug_calc?: AiDebugCalc;
    bias?: AiBiasParams;
  } | null;
};

export type ParsedVersionData = {
  id: string;
  version: number;
  overall?: number;
  categories: Record<string, number>;
};

type ProgressPayload = {
  progress?: number;
  status?: string;
  [key: string]: any;
};

export async function evaluateDesign(
  input: EvaluateInput
): Promise<EvalResponse[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  console.log("Calling evaluate with:", input);

  const res = await fetch(`${baseUrl}/api/ai/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  console.log("Evaluate response:", data);

  if (!res.ok) {
    console.error("Evaluate failed:", data);
    throw new Error(data?.error || "Failed to evaluate");
  }
  console.log("Existing data: ", data);
  return data as EvalResponse[];
}

export default function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const lastVersionIdRef = useRef<string | null>(null);

  const router = useRouter();

  const [showEval, setShowEval] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [designLoading, setDesignLoading] = useState(true);
  const [evalResult, setEvalResult] = useState<EvalResponse | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [versions, setVersions] = useState<Versions[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versionChanged, setVersionChanged] = useState(0);
  const [frameEvaluations, setFrameEvaluations] = useState<FrameEvaluation[]>(
    []
  );
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">(
    "default"
  );
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    fullName: string;
    avatarUrl: string;
  } | null>(null);
  const [showEvalParams, setShowEvalParams] = useState(false);
  const [pendingParams, setPendingParams] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(700);
  const minSidebarWidth = 0;
  const maxSidebarWidth = 700;
  const [isResizing, setIsResizing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mouseStart = useRef({ x: 0, y: 0 });
  const [sidebarTab, setSidebarTab] = useState<"ai" | "comments">("ai");
  const [expectedFrameCount, setExpectedFrameCount] = useState<number>(0);
  const [evaluatedFramesCount, setEvaluatedFramesCount] = useState<number>(0);
  const pageSize = 6;
  const sortRef = useRef<HTMLDivElement>(null);
  const [backendProgress, setBackendProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("started");
  const [weaknesses, setWeaknesses] = React.useState<IWeakness[]>([]);
  const [loadingWeaknesses, setLoadingWeaknesses] = React.useState(false);
  const [allVersions, setAllVersions] = useState<Versions[]>([]);
  const [previousVersionScores, setPreviousVersionScores] =
    useState<ParsedVersionData | null>(null);
  const [currentVersionScores, setCurrentVersionScores] =
    useState<ParsedVersionData | null>(null);
  const [softRefreshing, setSoftRefreshing] = useState(false);
  const [vpCollapsed, setVpCollapsed] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  function startResizing() {
    setIsResizing(true);
  }

  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX - 8;
      setSidebarWidth(
        Math.max(minSidebarWidth, Math.min(maxSidebarWidth, newWidth))
      );
      if (newWidth <= 20) setShowEval(false);
    }
    function handleMouseUp() {
      setIsResizing(false);
    }
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, sidebarWidth, minSidebarWidth, maxSidebarWidth]);

  function handlePanStart(e: React.MouseEvent) {
    if (zoom === 1) return;
    setIsPanning(true);
    panStart.current = { ...pan };
    mouseStart.current = { x: e.clientX, y: e.clientY };
  }

  const handlePanMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - mouseStart.current.x;
      const dy = e.clientY - mouseStart.current.y;
      setPan({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
    },
    [isPanning, mouseStart, panStart, setPan]
  );

  function handlePanEnd() {
    setIsPanning(false);
  }

  function safeParse(raw: string) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  const showVersionProgress = React.useMemo(() => {
    if (loadingEval || designLoading || softRefreshing) return false;
    if (!currentVersionScores || !previousVersionScores) return false;
    // optional: avoid showing if somehow comparing same version
    if (currentVersionScores.version === previousVersionScores.version)
      return false;
    return true;
  }, [
    loadingEval,
    designLoading,
    softRefreshing,
    currentVersionScores,
    previousVersionScores,
  ]);

  const fetchEvaluations = React.useCallback(
    async (overrideVersionId?: string | null) => {
      const supabase = createClient();
      console.log(
        "[fetchEvaluations] Fetching version for design:",
        design?.id,
        "overrideVersionId:",
        overrideVersionId
      );

      // If a version id is provided, fetch that specific version.
      // Otherwise, fall back to the latest version for this design.
      let versionData: any = null;
      let versionError: any = null;

      if (overrideVersionId) {
        const { data, error } = await supabase
          .from("design_versions")
          .select(
            `
          id, design_id, version, file_key, node_id, thumbnail_url, created_by,
          ai_summary, ai_data, snapshot, created_at, updated_at, total_score
        `
          )
          .eq("id", overrideVersionId)
          .maybeSingle();
        versionData = data;
        versionError = error;
      } else {
        const { data, error } = await supabase
          .from("design_versions")
          .select(
            `
          id, design_id, version, file_key, node_id, thumbnail_url, created_by,
          ai_summary, ai_data, snapshot, created_at, updated_at, total_score
        `
          )
          .eq("design_id", design?.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        versionData = data;
        versionError = error;
      }

      if (versionError) {
        console.error(
          "[fetchEvaluations] Failed to fetch version:",
          versionError.message
        );
        return;
      }
      if (!versionData) {
        console.warn(
          "[fetchEvaluations] No version data found for design:",
          design?.id
        );
        setFrameEvaluations([]);
        return;
      }

      if (
        !versionData.ai_summary ||
        !versionData.ai_data ||
        typeof versionData.total_score !== "number" ||
        versionData.total_score === 0
      ) {
        console.warn(
          "[fetchEvaluations] Skipping incomplete version:",
          versionData.id
        );
      }

      let aiData = versionData.ai_data;
      if (typeof aiData === "string") {
        try {
          aiData = JSON.parse(aiData);
        } catch (e) {
          console.error(
            "[fetchEvaluations] Failed to parse ai_data:",
            e,
            versionData.ai_data
          );
          aiData = {};
        }
      }

      console.log(
        "[fetchEvaluations] Fetching frames for version_id:",
        versionData.id
      );

      const { data: frameData, error: frameError } = await supabase
        .from("design_frame_evaluations")
        .select(
          `
        id, design_id, version_id, file_key, node_id, thumbnail_url, owner_id,
        ai_summary, ai_data, snapshot, created_at, updated_at
      `
        )
        .eq("design_id", design?.id)
        .eq("version_id", versionData.id)
        .order("created_at", { ascending: true });

      if (frameError) {
        console.error(
          "[fetchEvaluations] Failed to fetch frame evaluations:",
          frameError.message
        );
        setFrameEvaluations([]);
        return;
      }

      const frames = (frameData || []).map((frame: any, i: number) => ({
        ...frame,
        ai_data:
          typeof frame.ai_data === "string"
            ? safeParse(frame.ai_data)
            : frame.ai_data,
        originalIndex: i,
      }));

      if (
        lastVersionIdRef.current !== String(versionData.id) ||
        JSON.stringify(frameEvaluations) !== JSON.stringify(frames)
      ) {
        setFrameEvaluations(frames);
        lastVersionIdRef.current = String(versionData.id);
        if (selectedFrameIndex >= frames.length) setSelectedFrameIndex(0);
        console.log(
          "[fetchEvaluations] Frame evaluations set (version-aware):",
          frames
        );
      } else {
        console.log(
          "[fetchEvaluations] Frames identical, skipping state update."
        );
      }
    },
    [design?.id, frameEvaluations, selectedFrameIndex]
  );

  const fetchWeaknesses = React.useCallback(
    async (designId?: string | null, versionId?: string | null) => {
      const did = designId ?? design?.id ?? null;
      setLoadingWeaknesses(true);
      if (!did) {
        console.warn("fetchWeaknesses: missing designId");
        setLoadingWeaknesses(false);
        return;
      }
      try {
        const supabase = createClient();
        let vid = versionId ?? design?.current_version_id ?? null;
        if (!vid) {
          const { data: latest, error: latestError } = await supabase
            .from("design_versions")
            .select("id, thumbnail_url, ai_data, created_at")
            .eq("design_id", did)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latestError)
            console.warn("fetchWeaknesses: latest lookup failed", latestError);
          vid = latest?.id ?? null;
        }
        if (!vid) {
          setWeaknesses([]);
          return;
        }

        const vPromise = supabase
          .from("design_versions")
          .select("id, thumbnail_url, ai_data, created_at")
          .eq("id", vid)
          .maybeSingle();

        const fPromise = supabase
          .from("design_frame_evaluations")
          .select("id, ai_data, thumbnail_url, version_id, node_id")
          .eq("design_id", did)
          .eq("version_id", vid)
          .order("created_at", { ascending: true });

        const [
          { data: versionData, error: vError },
          { data: frames, error: fError },
        ] = await Promise.all([vPromise, fPromise]);

        if (vError)
          console.warn("fetchWeaknesses: version query error", vError);
        if (fError) console.warn("fetchWeaknesses: frames query error", fError);

        const collected: any[] = [];
        const normalizeEntries = (raw: any) => {
          if (raw == null) return [];
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
        };

        if (versionData?.ai_data) {
          try {
            const parsed =
              typeof versionData.ai_data === "string"
                ? JSON.parse(versionData.ai_data)
                : versionData.ai_data;
            normalizeEntries(parsed).forEach((entry: any) => {
              const root = entry?.ai ?? entry;
              if (Array.isArray(root?.weaknesses)) {
                collected.push(
                  ...root.weaknesses.map((it: any) => ({
                    ...(it || {}),
                    frameId: "version-global",
                    versionId: versionData.id,
                    thumbnail_url:
                      it?.thumbnail_url ?? versionData.thumbnail_url,
                  }))
                );
              }
              if (Array.isArray(root?.issues)) {
                collected.push(
                  ...root.issues.map((it: any) => ({
                    ...(it || {}),
                    frameId: "version-global",
                    versionId: versionData.id,
                    thumbnail_url:
                      it?.thumbnail_url ?? versionData.thumbnail_url,
                  }))
                );
              }
            });
          } catch (e) {
            console.warn("fetchWeaknesses: failed to parse version ai_data", e);
          }
        }

        if (Array.isArray(frames) && frames.length) {
          frames.forEach((f: any) => {
            if (!f?.ai_data) return;
            try {
              const parsed =
                typeof f.ai_data === "string"
                  ? JSON.parse(f.ai_data)
                  : f.ai_data;
              normalizeEntries(parsed).forEach((entry: any) => {
                const root = entry?.ai ?? entry;
                const attachMeta = (item: any) => {
                  const nodeFromItem =
                    item?.frameId ?? item?.node_id ?? item?.nodeId ?? f.node_id;
                  const normalizedFrameId = nodeFromItem ?? `eval-${f.id}`;
                  return {
                    ...(item || {}),
                    frameId: normalizedFrameId,
                    frameEvalId: f.id,
                    thumbnail_url: f.thumbnail_url ?? item?.thumbnail_url,
                    versionId: f.version_id ?? vid,
                  };
                };
                if (Array.isArray(root?.weaknesses))
                  collected.push(...root.weaknesses.map(attachMeta));
                if (Array.isArray(root?.issues))
                  collected.push(...root.issues.map(attachMeta));
              });
            } catch (e) {
              console.warn(
                "fetchWeaknesses: failed to parse frame ai_data",
                f.id,
                e
              );
            }
          });
        }

        // dedupe
        const uniq: any[] = [];
        const seen = new Set<string>();
        collected.forEach((w: any) => {
          const framePart =
            w.frameId ?? w.frameEvalId ?? w.node_id ?? "frame:global";
          const key = `${framePart}::${w.id ?? w.message ?? JSON.stringify(w)}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniq.push(w);
          }
        });
        // debug: group by version and show small samples
        // toast.message(
        //   `fetchWeaknesses vid=${vid} collected=${collected.length} uniq=${uniq.length}`
        // );
        const byVersion = uniq.reduce<Record<string, any[]>>((acc, item) => {
          const k = String(item.versionId ?? "no-version");
          (acc[k] = acc[k] || []).push(item);
          return acc;
        }, {});
        Object.entries(byVersion).forEach(([ver, items]) => {
          console.log(`version ${ver}: count=${items.length}`);
          console.table(
            items.slice(0, 6).map((it: any) => ({
              id: it.id ?? "(no-id)",
              frameId:
                it.frameId ?? it.frameEvalId ?? it.node_id ?? "(no-frame)",
              message: it.message ?? it.description ?? "(no-message)",
              thumbnail: it.thumbnail_url ?? "(no-thumb)",
            }))
          );
        });
        console.groupEnd();
        // console.error(
        //   "fetchWeaknesses: vid=",
        //   vid,
        //   "collected=",
        //   collected.length,
        //   "uniq=",
        //   uniq.length
        // );
        setWeaknesses(uniq);
      } catch (err) {
        console.error("fetchWeaknesses failed:", err);
        setWeaknesses([]);
      } finally {
        setLoadingWeaknesses(false);
      }
    },
    [design?.id, design?.current_version_id]
  );

  const sortedFrameEvaluations = React.useMemo(() => {
    if (sortOrder === "default") return frameEvaluations;

    const getFrameScore = (f: FrameEvaluation) => {
      const ai: any = f.ai_data ?? {};
      const root = ai.ai ?? ai;
      const dbg = root?.debug_calc;

      // 1) Prefer mean you show in the ring
      if (typeof dbg?.combined === "number") return dbg.combined;
      if (typeof dbg?.final === "number") return dbg.final;

      // 2) Fallback: explicit overall_score
      if (typeof root?.overall_score === "number") return root.overall_score;
      if (typeof f.total_score === "number") return f.total_score;

      // 3) Fallback: compute from categories/heuristics if present
      let catsAvg: number | undefined;
      const cats = root?.category_scores;
      if (cats && typeof cats === "object") {
        const vals = Object.values(cats).filter(
          (v): v is number => typeof v === "number" && Number.isFinite(v)
        );
        if (vals.length)
          catsAvg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      }

      let heurAvg: number | undefined;
      const hb: any[] = Array.isArray(root?.heuristic_breakdown)
        ? root.heuristic_breakdown
        : [];
      if (hb.length) {
        const pctSum = hb.reduce((acc, h) => {
          const s = typeof h.score === "number" ? h.score : 0;
          const m =
            typeof h.max_points === "number" && h.max_points > 0
              ? h.max_points
              : 4;
          return acc + (s / m) * 100;
        }, 0);
        heurAvg = Math.round(pctSum / hb.length);
      }

      if (typeof catsAvg === "number" && typeof heurAvg === "number")
        return Math.round((catsAvg + heurAvg) / 2);
      if (typeof catsAvg === "number") return catsAvg;
      if (typeof heurAvg === "number") return heurAvg;

      // 4) Last resort
      return 0;
    };

    return [...frameEvaluations].sort((a, b) => {
      const aScore = getFrameScore(a);
      const bScore = getFrameScore(b);
      return sortOrder === "asc" ? aScore - bScore : bScore - aScore;
    });
  }, [frameEvaluations, sortOrder]);

  const filteredFrameEvaluations = React.useMemo(() => {
    if (!searchQuery.trim()) return sortedFrameEvaluations;
    return sortedFrameEvaluations.filter(
      (frame) =>
        (frame.ai_summary || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (frame.ai_data?.summary || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (frame.node_id || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedFrameEvaluations, searchQuery]);

  const currentFrame = sortedFrameEvaluations[selectedFrameIndex];
  const derivedEval = React.useMemo(
    () =>
      currentFrame
        ? mapFrameToEvalResponse(currentFrame, selectedFrameIndex)
        : null,
    [currentFrame, selectedFrameIndex]
  );

  function handleOpenEvalParams() {
    const frameIds = design?.frames?.map((f) => String(f.id)) ?? [];
    console.log("[handleOpenEvalParams] frameIds:", frameIds);

    const thumbnailUrl =
      thumbUrl ||
      design?.thumbnail ||
      design?.imageUrl ||
      "/images/design-thumbnail.png";

    setPendingParams({
      designId: design?.id,
      fileKey: design?.fileKey,
      nodeId: design?.nodeId,
      snapshot: design?.snapshot,
      url: design?.figma_link,
      fallbackImageUrl: thumbnailUrl,
      frameIds,
    });
    setShowEvalParams(true);
  }

  async function handleOpenComments() {
    setShowComments(true);
    setLoadingComments(true);

    const supabase = createClient();

    if (currentUserId && design?.id) {
      await supabase
        .from("comments")
        .update({ is_read: true })
        .eq("design_id", design.id)
        .eq("user_id", currentUserId)
        .eq("is_read", false);
    }

    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id, text, user_id, created_at, local_time, 
        is_read, parent_id, updated_at, design_id,
        profiles:profiles!comments_user_id_fkey (
          first_name, middle_name, last_name, avatar_url
        )
      `
      )
      .eq("design_id", design?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mappedComments = (data || []).map((comment: any) => ({
        id: comment.id,
        text: comment.text,
        user: {
          id: comment.user_id,
          fullName:
            [
              comment.profiles?.first_name,
              comment.profiles?.middle_name,
              comment.profiles?.last_name,
            ]
              .filter(Boolean)
              .join(" ") || "",
          avatarUrl: comment.profiles?.avatar_url || "",
        },
        replies: [],
        parentId: comment.parent_id,
        createdAt: new Date(comment.created_at),
        updatedAt: comment.updated_at
          ? new Date(comment.updated_at)
          : undefined,
        localTime: comment.local_time,
        design_id: comment.design_id,
        is_read: comment.is_read,
      }));

      const commentMap: { [id: string]: any } = {};
      mappedComments.forEach((comment) => {
        commentMap[comment.id] = { ...comment, replies: [] };
      });
      const rootComments: any[] = [];
      mappedComments.forEach((comment) => {
        if (comment.parentId) {
          if (commentMap[comment.parentId]) {
            commentMap[comment.parentId].replies.push(commentMap[comment.id]);
          }
        } else {
          rootComments.push(commentMap[comment.id]);
        }
      });

      setComments(rootComments);
    }
    setLoadingComments(false);
  }

  const handleShowVersions = async () => {
    setShowVersions(true);
    setLoadingVersions(true);
    if (design?.id) {
      fetchDesignVersions(design.id)
        .then((versions) =>
          setVersions(
            versions.map((v: any) => ({
              ...v,
              total_score: v.total_score ?? 0,
            }))
          )
        )
        .catch((e: string) => console.error("Failed to fetch versions", e))
        .finally(() => setLoadingVersions(false));
    } else {
      setLoadingVersions(false);
    }
  };

  const handleEvaluate = React.useCallback(async () => {
    if (!design?.id || !design?.fileKey) {
      console.error("Missing required design data:", {
        id: design?.id,
        fileKey: design?.fileKey,
      });
      setEvalError("Missing required design data");
      return;
    }

    setLoadingEval(true);
    setEvalError(null);

    try {
      let imageUrlForAI = design.thumbnail;
      if (imageUrlForAI && !imageUrlForAI.startsWith("http")) {
        const supabase = createClient();
        const { data: signed } = await supabase.storage
          .from("design-thumbnails")
          .createSignedUrl(imageUrlForAI, 3600);

        if (signed?.signedUrl) {
          imageUrlForAI = signed.signedUrl;
        }
      }

      console.log("Starting evaluation with:", {
        designId: design.id,
        fileKey: design.fileKey,
        nodeId: design.nodeId,
        thumbnail: imageUrlForAI,
        snapshot: design.snapshot,
        url: design.figma_link,
      });

      const data = await evaluateDesign({
        designId: design.id,
        fileKey: design.fileKey,
        nodeId: design.nodeId,
        fallbackImageUrl: imageUrlForAI,
        snapshot:
          typeof design?.snapshot === "string"
            ? JSON.parse(design.snapshot)
            : design?.snapshot,
        url: design.figma_link,
        frameIds: design?.frames?.map((f) => String(f.id)) ?? [],
        versionId: design.current_version_id || "",
      });
      console.log("Evaluation successful:", data);
      setEvalResult(data[0]);

      try {
        const supabase = createClient();
        const { data: updatedDesign, error } = await supabase
          .from("designs")
          .select("id, current_version_id")
          .eq("id", design.id)
          .single();
        if (!error && updatedDesign) {
          setDesign((prev) =>
            prev
              ? {
                  ...prev,
                  current_version_id: updatedDesign.current_version_id,
                }
              : prev
          );
        }
      } catch (err) {
        console.error(
          "Failed to refresh current_version_id after evaluation:",
          err
        );
      }
      setLoadingVersions(true);
    } catch (e: any) {
      console.error("Evaluation failed:", e);
      setEvalError(e.message || "Failed to evaluate");
    } finally {
      setLoadingEval(false);
      setLoadingVersions(false);
    }
  }, [
    design,
    setEvalError,
    setLoadingEval,
    setEvalResult,
    setDesign,
    setLoadingVersions,
  ]);

  const syncPublishedState = React.useCallback(async (): Promise<void> => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Exit early if required IDs are missing
    if (!design?.id || !userId) return;

    // Query for the published record for this user and design
    const { data: published, error } = await supabase
      .from("published_designs")
      .select("*")
      .eq("design_id", design.id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Failed to sync published state:", error);
      return;
    }

    setDesign((prev) =>
      prev
        ? {
            ...prev,
            is_active: !!published,
            published_version_id: published?.published_version_id || "",
            published_at: published?.published_at || "",
          }
        : prev
    );
  }, [design?.id]);
  async function publishProject() {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Check if a published record already exists
    const { data: existing, error: fetchError } = await supabase
      .from("published_designs")
      .select("*")
      .eq("design_id", design?.id)
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      toast.error("Failed to check publish status.");
      return;
    }

    let error;
    if (existing) {
      // Update is_active to true
      ({ error } = await supabase
        .from("published_designs")
        .update({
          is_active: true,
          published_at: new Date().toISOString(),
          published_version_id: design?.current_version_id,
        })
        .eq("id", existing.id));
    } else {
      // Insert new row
      ({ error } = await supabase.from("published_designs").insert({
        design_id: design?.id,
        user_id: userId,
        published_version_id: design?.current_version_id,
        published_at: new Date().toISOString(),
        is_active: true,
      }));
    }

    if (!error) {
      toast.success("Design published to the community!");
    } else {
      toast.error(
        `Failed to publish design: ${error.message || "Unknown error"}`
      );
    }
  }
  async function unpublishProject() {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Set is_active to false
    const { error } = await supabase
      .from("published_designs")
      .update({ is_active: false })
      .eq("design_id", design?.id)
      .eq("user_id", userId);

    if (!error) {
      setDesign((prev) => (prev ? { ...prev, is_active: false } : prev));
      toast.success("Design unpublished!");
    } else {
      toast.error(
        `Failed to unpublish design: ${error.message || "Unknown error"}`
      );
    }
  }

  async function fetchCommentWithProfile(commentId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id, text, user_id, created_at, local_time, parent_id, updated_at, design_id, is_read,
        profiles:profiles!comments_user_id_fkey (
          first_name, middle_name, last_name, avatar_url
        )
      `
      )
      .eq("id", commentId)
      .single();
    if (error) {
      console.error("Failed to fetch comment with profile:", error);
      return null;
    }

    return {
      id: data.id,
      text: data.text,
      user: {
        id: data.user_id,
        fullName:
          [
            data.profiles?.first_name,
            data.profiles?.middle_name,
            data.profiles?.last_name,
          ]
            .filter(Boolean)
            .join(" ") || "",
        avatarUrl: data.profiles?.avatar_url || "",
      },
      replies: [],
      parentId: data.parent_id,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      localTime: data.local_time,
      design_id: data.design_id,
      is_read: data.is_read,
    };
  }

  function mapFrameToEvalResponse(
    frame: FrameEvaluation,
    frameIdx = 0
  ): EvalResponse {
    const aiData: any = frame.ai_data ?? {};
    // normalize: many rows store everything under ai_data.ai
    const root: any = aiData.ai ?? aiData;

    const issues = Array.isArray(root.issues) ? root.issues : [];
    const mappedIssues = issues.map((issue: any, issueIdx: number) => ({
      ...issue,
      id: `frame${frameIdx}-issue${issueIdx}`,
      // normalize field name
      suggestions: issue.suggestion ?? issue.suggestions,
    }));

    return {
      nodeId: frame.node_id,
      imageUrl: frame.thumbnail_url,
      summary: frame.ai_summary || root.summary || "",
      heuristics: root.heuristics ?? root.heuristic_breakdown ?? null,
      ai_status: "ok",
      overall_score: root.overall_score ?? null,
      strengths: Array.isArray(root.strengths) ? root.strengths : [],
      weaknesses: Array.isArray(root.weaknesses) ? root.weaknesses : [],
      issues: mappedIssues,
      category_scores: root.category_scores ?? null,
      ai: {
        ...root,
        issues: mappedIssues,
        category_scores: root.category_scores ?? undefined,
        heuristic_breakdown:
          root.heuristic_breakdown ?? root.heuristics ?? undefined,
        debug_calc: root.debug_calc ?? undefined,
      },
    };
  }

  const handleAddComment = async () => {
    const supabase = createClient();
    if (
      !newCommentText.trim() ||
      !currentUserId ||
      !currentUserProfile ||
      !design
    )
      return;

    setPostingComment(true);

    const { error } = await supabase.from("comments").insert([
      {
        user_id: currentUserId,
        design_id: design.id,
        text: newCommentText,
        parent_id: null,
        local_time: new Date().toLocaleTimeString(),
      },
    ]);

    if (error) {
      toast.error(`Failed to add comment!, ${error.message}`);
      console.error(error.message);
      setPostingComment(false);
      return;
    }

    setNewCommentText("");
    setPostingComment(false);
    fetchComments();
  };

  const handleAddReply = async (parentId: string, replyText: string) => {
    console.log("Parent handleAddReply called with:", parentId, replyText);
    const supabase = createClient();
    if (!replyText.trim() || !currentUserId || !currentUserProfile || !design)
      return;

    setPostingComment(true);

    const { error } = await supabase.from("comments").insert([
      {
        user_id: currentUserId,
        design_id: design.id,
        text: replyText,
        parent_id: parentId,
        local_time: new Date().toLocaleTimeString(),
      },
    ]);

    if (error) {
      toast.error(`Failed to add reply! ${error.message}`);
      setPostingComment(false);
      return;
    }

    setPostingComment(false);
    fetchComments();
    console.log("fetchComments called after reply");
  };

  const fetchComments = useCallback(async () => {
    const supabase = createClient();

    if (!design?.id) {
      return;
    }
    setLoadingComments(true);
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id, text, user_id, created_at, local_time, parent_id, updated_at, design_id,
        profiles:profiles!comments_user_id_fkey (
          first_name, middle_name, last_name, avatar_url
        )
      `
      )
      .eq("design_id", design?.id)
      .order("created_at", { ascending: false });
    // .range(0, 19);

    if (error) {
      console.log("Supabase error:", error);
      toast.error(`Failed to fetch comments! ${error.message}`);
      setLoadingComments(false);
      return;
    }
    const commentsWithUser = (data || []).map((comment: any) => ({
      id: comment.id,
      text: comment.text,
      user: {
        id: comment.user_id,
        fullName:
          [
            comment.profiles?.first_name,
            comment.profiles?.middle_name,
            comment.profiles?.last_name,
          ]
            .filter(Boolean)
            .join(" ") || "",
        avatarUrl: comment.profiles?.avatar_url || "",
      },
      replies: [],
      parentId: comment.parent_id,
      createdAt: new Date(comment.created_at),
      updatedAt: comment.updated_at ? new Date(comment.updated_at) : undefined,
      localTime: comment.local_time,
      design_id: comment.design_id,
    }));

    console.log("commentsWithUser", commentsWithUser);

    const commentMap: { [id: string]: any } = {};
    commentsWithUser.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    const rootComments: any[] = [];
    commentsWithUser.forEach((comment) => {
      if (comment.parentId) {
        if (commentMap[comment.parentId]) {
          commentMap[comment.parentId].replies.push(commentMap[comment.id]);
        }
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });
    console.log("rootComments", rootComments);
    setComments(rootComments);
    // setLoadingComments(false);
  }, [design?.id]);

  const handleDeleteComment = (id: string) => {
    setComments(comments.filter((comment) => comment.id !== id));
    fetchComments();
  };

  // Helper to update a comment in the tree
  const updateCommentTree = React.useCallback((comments, updated) => {
    return comments.map((comment) => {
      if (comment.id === updated.id) {
        return { ...comment, ...updated };
      }
      return {
        ...comment,
        replies: comment.replies
          ? updateCommentTree(comment.replies, updated)
          : [],
      };
    });
  }, []);

  // Helper to delete a comment from the tree
  const deleteCommentTree = React.useCallback((comments, idToDelete) => {
    return comments
      .filter((comment) => comment.id !== idToDelete)
      .map((comment) => ({
        ...comment,
        replies: comment.replies
          ? deleteCommentTree(comment.replies, idToDelete)
          : [],
      }));
  }, []);

  function parseVersionScores(v: any): ParsedVersionData | null {
    if (!v) return null;

    let raw = v.ai_data;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        return {
          id: v.id,
          version: v.version,
          overall:
            typeof v.total_score === "number"
              ? Math.round(v.total_score)
              : undefined,
          categories: {},
        };
      }
    }

    const toEntries = (x: any): any[] => {
      if (!x) return [];
      if (Array.isArray(x)) return x;
      if (typeof x === "object") {
        const keys = Object.keys(x);
        if (keys.length && keys.every((k) => /^\d+$/.test(k))) {
          return keys
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => (x as any)[k]);
        }
        if (Array.isArray((x as any).frames)) return (x as any).frames;
        return [x];
      }
      return [];
    };

    const entries = toEntries(raw).map((e) =>
      e && typeof e === "object" && "ai" in e ? (e as any).ai : e
    );

    const combinedVals: number[] = [];
    const finalVals: number[] = [];
    const overallVals: number[] = [];
    const heuristicsAvgVals: number[] = [];
    const categoriesAvgVals: number[] = [];

    const perCategory: Record<string, { sum: number; n: number }> = {};

    entries.forEach((root) => {
      if (!root || typeof root !== "object") return;
      const dbg = (root as any).debug_calc;

      if (dbg && typeof dbg.combined === "number")
        combinedVals.push(dbg.combined);
      if (dbg && typeof dbg.final === "number") finalVals.push(dbg.final);
      if (dbg && typeof dbg.heuristics_avg === "number")
        heuristicsAvgVals.push(dbg.heuristics_avg);
      if (dbg && typeof dbg.categories_avg === "number")
        categoriesAvgVals.push(dbg.categories_avg);
      if (typeof (root as any).overall_score === "number")
        overallVals.push((root as any).overall_score);

      const cats = (root as any).category_scores;
      if (cats && typeof cats === "object") {
        Object.entries(cats).forEach(([k, val]) => {
          if (typeof val === "number" && Number.isFinite(val)) {
            if (!perCategory[k]) perCategory[k] = { sum: 0, n: 0 };
            perCategory[k].sum += val;
            perCategory[k].n += 1;
          }
        });
      }
    });

    // If no frame entries, try single root shape
    if (!entries.length && raw && typeof raw === "object") {
      const root: any = (raw as any).ai ?? raw;
      const dbg = root?.debug_calc;
      if (dbg?.combined) combinedVals.push(dbg.combined);
      if (dbg?.final) finalVals.push(dbg.final);
      if (dbg?.heuristics_avg) heuristicsAvgVals.push(dbg.heuristics_avg);
      if (dbg?.categories_avg) categoriesAvgVals.push(dbg.categories_avg);
      if (typeof root?.overall_score === "number")
        overallVals.push(root.overall_score);
      const cats = root?.category_scores;
      if (cats && typeof cats === "object") {
        Object.entries(cats).forEach(([k, val]) => {
          if (typeof val === "number") perCategory[k] = { sum: val, n: 1 };
        });
      }
    }

    const avg = (arr: number[]) =>
      arr.length
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : undefined;

    // Preferred overall: mean combined across frames
    const overall =
      avg(combinedVals) ??
      avg(finalVals) ??
      avg(overallVals) ??
      (typeof v.total_score === "number"
        ? Math.round(v.total_score)
        : undefined);

    // Build per-category averages
    const categories: Record<string, number> = {};
    Object.entries(perCategory).forEach(([k, { sum, n }]) => {
      categories[k] = Math.round(sum / Math.max(n, 1));
    });

    return {
      id: v.id,
      version: v.version,
      overall,
      categories,
    };
  }

  function diffArrow(newVal?: number, oldVal?: number) {
    if (typeof newVal !== "number" || typeof oldVal !== "number") {
      return <Minus className="h-3.5 w-3.5 text-gray-400" />;
    }
    const d = newVal - oldVal;
    if (d === 0) return <Minus className="h-3.5 w-3.5 text-gray-400" />;
    if (d > 0) return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />;
    return <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />;
  }

  function scoreTone(n?: number) {
    if (n == null)
      return "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    if (n >= 85)
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300";
    if (n >= 70) return "bg-blue-500/15 text-blue-600 dark:text-blue-300";
    if (n >= 50) return "bg-amber-500/15 text-amber-600 dark:text-amber-300";
    return "bg-rose-500/15 text-rose-600 dark:text-rose-300";
  }

  useEffect(() => {
    const supabase = createClient();
    async function fetchUserProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, middle_name, last_name, avatar_url")
          .eq("id", user.id)
          .single();
        setCurrentUserProfile({
          fullName:
            [profile?.first_name, profile?.middle_name, profile?.last_name]
              .filter(Boolean)
              .join(" ") || "Unknown",
          avatarUrl: profile?.avatar_url ?? "",
        });
      }
    }
    fetchUserProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortOptions(false);
      }
    }
    if (showSortOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortOptions]);

  useEffect(() => {
    if (design?.id) {
      syncPublishedState();
    }
  }, [design?.id, syncPublishedState]);

  useEffect(() => {
    async function loadDesign() {
      setDesignLoading(true);
      try {
        const supabase = createClient();

        const { data: designData, error: designError } = await supabase
          .from("designs")
          .select(
            `
            id, title, figma_link, file_key,
            node_id, thumbnail_url,
            current_version_id, owner_id,
            design_versions (
              id, file_key, node_id, thumbnail_url, total_score,
              ai_summary, ai_data, snapshot, created_at, version
            )
          `
          )
          .eq("id", id)
          .maybeSingle();

        if (designError || !designData) {
          console.error("Failed to load design:", designError, designData);
          setDesign(null);
          setDesignLoading(false);
          return;
        }

        const { data: publishedData } = await supabase
          .from("published_designs")
          .select(`is_active, published_version_id, published_at`)
          .eq("design_id", id)
          .eq("is_active", true)
          .maybeSingle();

        const latestVersion = designData.design_versions?.[0];
        let parsedAiData = null;
        if (latestVersion?.ai_data) {
          try {
            parsedAiData =
              typeof latestVersion.ai_data === "string"
                ? JSON.parse(latestVersion.ai_data)
                : latestVersion.ai_data;
          } catch (e) {
            console.error("Error parsing AI data:", e, latestVersion.ai_data);
          }
        }

        let frames: any[] = [];
        const latestVersionId = latestVersion?.id;
        if (latestVersionId) {
          const { data: frameData, error: frameError } = await supabase
            .from("design_frame_evaluations")
            .select(
              `id, design_id, version_id, file_key, node_id, thumbnail_url, owner_id,
              ai_summary, ai_data, snapshot, created_at, updated_at`
            )
            .eq("design_id", designData.id)
            .eq("version_id", latestVersionId)
            .order("created_at", { ascending: true });

          if (frameError) {
            console.error(
              "Failed to fetch frame evaluations:",
              frameError.message
            );
          } else {
            frames = (frameData || []).map((frame: any) => ({
              id: frame.node_id,
              name: frame.ai_summary || frame.node_id,
              ...frame,
              ai_data:
                typeof frame.ai_data === "string"
                  ? JSON.parse(frame.ai_data)
                  : frame.ai_data,
            }));
          }
        }

        const normalized: Design = {
          id: designData.id,
          project_name: designData.title,
          fileKey: latestVersion?.file_key || designData.file_key || undefined,
          nodeId: latestVersion?.node_id || designData.node_id || undefined,
          imageUrl: designData.thumbnail_url || "/images/design-thumbnail.png",
          thumbnail: designData.thumbnail_url || undefined,
          snapshot: latestVersion?.snapshot || null,
          current_version_id: designData.current_version_id,
          is_active: publishedData?.is_active ?? false,
          published_version_id: publishedData?.published_version_id ?? "",
          published_at: publishedData?.published_at ?? "",
          figma_link: designData.figma_link || "",
          owner_id: designData.owner_id,
          frames,
        };

        setDesign(normalized);
        console.log("Design loaded: ", normalized);
      } catch (err) {
        console.error("Error loading design:", err);
        setDesign(null);
      } finally {
        setDesignLoading(false);
      }
    }

    loadDesign();
  }, [id]);

  useEffect(() => {
    if (!design?.id || !selectedVersion?.id) return;
    fetchWeaknesses(design.id, selectedVersion.id).catch((e) =>
      console.warn("fetchWeaknesses failed:", e)
    );
  }, [design?.id, selectedVersion?.id, fetchWeaknesses]);

  useEffect(() => {
    if (frameEvaluations[selectedFrameIndex]) {
      setEvalResult(
        mapFrameToEvalResponse(
          frameEvaluations[selectedFrameIndex],
          selectedFrameIndex
        )
      );
    }
  }, [selectedFrameIndex, frameEvaluations]);

  useEffect(() => {
    const auto =
      typeof window !== "undefined" &&
      new URLSearchParams(location.search).get("auto") === "1";
    if (
      !designLoading &&
      auto &&
      design?.fileKey &&
      !loadingEval &&
      !evalResult
    ) {
      handleEvaluate();
    }
  }, [designLoading, design, loadingEval, evalResult, handleEvaluate]);

  useEffect(() => {
    if (!design?.thumbnail || design.thumbnail.startsWith("http")) return;
    const supabaseClient = createClient();
    const refresh = async () => {
      const { data: signed } = await supabaseClient.storage
        .from("design-thumbnails")
        .createSignedUrl(design.thumbnail as string, 3600);
      if (signed?.signedUrl) setThumbUrl(signed.signedUrl);
    };
    refresh();
    const idRef = setInterval(refresh, 55 * 60 * 1000);
    return () => clearInterval(idRef);
  }, [design?.thumbnail]);

  useEffect(() => {
    const supabase = createClient();
    async function loadSavedEvaluation() {
      try {
        if (!design?.id) return;
        const { data, error } = await supabase
          .from("design_versions")
          .select(
            `
            node_id, 
            thumbnail_url, 
            ai_summary, 
            ai_data, 
            total_score,
            snapshot, 
            created_at
          `
          )
          .eq("design_id", design.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Failed to load evaluation:", error.message);
          return;
        }

        // Parse the JSONB ai_data
        let parsedAiData = null;
        if (data?.ai_data) {
          try {
            parsedAiData =
              typeof data.ai_data === "string"
                ? JSON.parse(data.ai_data)
                : data.ai_data;

            console.log("Parsed saved AI data:", parsedAiData);
          } catch (err) {
            console.error("Error parsing saved AI data:", err);
          }
        }

        let snapshotParam = null;
        if (data?.snapshot) {
          try {
            snapshotParam =
              typeof data.snapshot === "string"
                ? JSON.parse(data.snapshot)
                : data.snapshot;
            console.log("Parsed snapshotParam:", snapshotParam);
          } catch (err) {
            console.error("Error parsing snapshotParam:", err, data.snapshot);
            snapshotParam = null;
          }
        }

        if (parsedAiData) {
          const mapped: EvalResponse = {
            nodeId: data?.node_id,
            imageUrl: data?.thumbnail_url,
            summary:
              data?.ai_summary ??
              parsedAiData.summary ??
              parsedAiData.ai?.summary ??
              "",
            heuristics:
              parsedAiData.heuristics ?? parsedAiData.ai?.heuristics ?? null,
            ai_status: "ok",
            strengths: Array.isArray(parsedAiData.strengths)
              ? parsedAiData.strengths
              : parsedAiData.ai?.strengths ?? [],
            weaknesses: Array.isArray(parsedAiData.weaknesses)
              ? parsedAiData.weaknesses
              : parsedAiData.ai?.weaknesses ?? [],
            issues: Array.isArray(parsedAiData.issues)
              ? parsedAiData.issues
              : parsedAiData.ai?.issues ?? [],
            category_scores:
              parsedAiData.category_scores ??
              parsedAiData.ai?.category_scores ??
              null,
            ai: parsedAiData.ai ?? parsedAiData,
            overall_score:
              parsedAiData.overall_score ??
              parsedAiData.ai?.overall_score ??
              data?.total_score ??
              null,
          };

          console.log("Setting saved evaluation:", mapped);
          setEvalResult(mapped);
          setShowEval(true);
        }
      } catch (err) {
        console.error("Failed to load saved AI evaluation:", err);
      }
    }

    loadSavedEvaluation();
  }, [design?.id]);

  useEffect(() => {
    if (showVersions) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showVersions]);

  useEffect(() => {
    if (showVersions) setPage(0);
  }, [showVersions, versions.length]);

  useEffect(() => {
    if (!design?.id) return;
    setLoadingVersions(true);
    fetchDesignVersions(design.id)
      .then((versions) =>
        setVersions(
          versions.map((v: any) => ({
            ...v,
            total_score: v.total_score ?? 0,
          }))
        )
      )
      .catch((e: string) => console.error("Failed to fetch versions", e))
      .finally(() => setLoadingVersions(false));
  }, [design?.id, versionChanged]);

  useEffect(() => {
    if (currentFrame) {
      setEvalResult(mapFrameToEvalResponse(currentFrame, selectedFrameIndex));
    }
  }, [currentFrame, selectedFrameIndex]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSelectedFrameIndex(0);
    } else {
      const num = parseInt(searchQuery.trim(), 10);
      if (!isNaN(num) && num > 0 && num < sortedFrameEvaluations.length) {
        setSelectedFrameIndex(num);
      } else {
        const idx = sortedFrameEvaluations.findIndex(
          (frame, i) =>
            i > 0 &&
            (frame.ai_summary
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
              frame.ai_data.summary
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              frame.node_id?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setSelectedFrameIndex(idx === -1 ? 0 : idx);
      }
    }
  }, [searchQuery, sortedFrameEvaluations]);

  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = "col-resize";
    } else {
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    if (isPanning) {
      document.body.style.cursor = "grab";
      document.addEventListener("mousemove", handlePanMove);
      document.addEventListener("mouseup", handlePanEnd);
    } else {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handlePanMove);
      document.removeEventListener("mouseup", handlePanEnd);
    }
    return () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handlePanMove);
      document.removeEventListener("mouseup", handlePanEnd);
    };
  }, [isPanning, handlePanMove]);

  useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom]);

  useEffect(() => {
    if (design?.id) {
      fetchComments();
    }
  }, [design?.id, fetchComments]);

  useEffect(() => {
    if (!design?.id) {
      console.log("[Realtime] No design id, skipping subscription setup.");
      return;
    }
    console.log("[Realtime] Setting up subscription for design:", design.id);
    const supabase = createClient();

    const channel = supabase
      .channel("comments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `design_id=eq.${design.id}`,
        },
        async (payload) => {
          console.log("[Realtime] Payload received:", payload);

          if (payload.eventType === "INSERT") {
            console.log(
              "[Realtime] INSERT event for comment id:",
              payload.new.id
            );

            let newComment = null;
            for (let i = 0; i < 5; i++) {
              newComment = await fetchCommentWithProfile(payload.new.id);
              if (newComment) break;
              await new Promise((res) => setTimeout(res, 250));
            }

            console.log(
              "[Realtime] Fetched new comment with profile (after retry):",
              newComment
            );
            if (!newComment) {
              console.warn(
                "[Realtime] New comment fetch failed or returned null after retries."
              );
              return;
            }
            fetchComments();
          } else if (payload.eventType === "UPDATE") {
            console.log(
              "[Realtime] UPDATE event for comment id:",
              payload.new.id
            );

            let updatedComment = null;
            for (let i = 0; i < 5; i++) {
              updatedComment = await fetchCommentWithProfile(payload.new.id);
              if (updatedComment) break;
              await new Promise((res) => setTimeout(res, 250));
            }

            if (!updatedComment) {
              console.warn(
                "[Realtime] Updated comment fetch failed or returned null after retries."
              );
              return;
            }

            setComments((prev) => {
              const updated = updateCommentTree(prev, updatedComment);
              console.log("[Realtime] Comments after UPDATE:", updated);
              return updated;
            });
          } else if (payload.eventType === "DELETE") {
            console.log(
              "[Realtime] DELETE event for comment id:",
              payload.old.id
            );
            setComments((prev) => {
              const updated = deleteCommentTree(prev, payload.old.id);
              console.log("[Realtime] Comments after DELETE:", updated);
              return updated;
            });
          }
        }
      )
      .subscribe();
    console.log("[Realtime] Setting up subscription for design:", design.id);
    return () => {
      console.log("[Realtime] Cleaning up subscription for design:", design.id);
      supabase.removeChannel(channel);
    };
  }, [design?.id, deleteCommentTree, updateCommentTree, fetchComments]);

  useEffect(() => {
    if (editingId && !comments.some((c) => c.id === editingId)) {
      setEditingId(null);
    }
    if (replyingToId && !comments.some((c) => c.id === replyingToId)) {
      setReplyingToId(null);
    }
  }, [replyingToId, editingId, comments]);

  useEffect(() => {
    if (sidebarTab !== "comments") {
      setEditingId(null);
      setReplyingToId(null);
    }
  }, [sidebarTab]);

  useEffect(() => {
    if (!design?.id || loadingEval) return;
    fetchEvaluations(selectedVersion?.id ?? null);
  }, [design?.id, fetchEvaluations, loadingEval, selectedVersion?.id]);

  useEffect(() => {
    if (!loadingEval || !design?.current_version_id) return;

    const supabase = createClient();
    console.log(
      "[Realtime] Subscribing with job_id filter:",
      design.current_version_id
    );
    const channel = supabase
      .channel("progress-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "frame_evaluation_progress",
          filter: `job_id=eq.${design.current_version_id}`,
        },
        (payload: { new: ProgressPayload }) => {
          console.log("Realtime progress payload: ", payload);
          const newProgress = payload.new?.progress ?? 0;
          const newStatus = payload.new?.status ?? "started";
          setBackendProgress(newProgress);
          setProgressStatus(newStatus);

          // Stop loading when evaluation is complete
          if (newProgress === 100 && newStatus === "completed") {
            setLoadingEval(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadingEval, design?.current_version_id]);

  useEffect(() => {
    console.log("[loadingEval] changed:", loadingEval);
  }, [loadingEval]);

  useEffect(() => {
  if (!design?.id) return;
  fetchDesignVersions(design.id)
    .then((versions) => setAllVersions(versions))
    .catch((e) => console.error("Failed to fetch versions", e));
}, [design?.id]);

  useEffect(() => {
    if (!versions || versions.length === 0) return;
    // versions assumed DESC (latest first). If not, sort defensively:
    const sorted = [...versions].sort(
      (a, b) => (b.version ?? 0) - (a.version ?? 0)
    );

    // Determine “current” = selectedVersion (if set) else latest
    const current = selectedVersion
      ? sorted.find((v) => v.id === selectedVersion.id) || sorted[0]
      : sorted[0];
    const currentIdx = sorted.findIndex((v) => v.id === current.id);

    // “Previous” = the next older version (index +1). If none, null.
    const previous =
      currentIdx >= 0 && currentIdx + 1 < sorted.length
        ? sorted[currentIdx + 1]
        : null;

    // Parse
    const parsedCurrent = parseVersionScores(current);
    const parsedPrevious = previous ? parseVersionScores(previous) : null;

    setCurrentVersionScores(parsedCurrent);
    setPreviousVersionScores(parsedPrevious);
  }, [versions, selectedVersion]);

  useEffect(() => {
    if (!loadingEval && design?.id) {
      // Keep currently selected version’s frames stable after backend updates
      fetchEvaluations(selectedVersion?.id ?? null);
      fetchDesignVersions(design.id)
        .then((vs) =>
          setVersions(
            vs.map((v: any) => ({ ...v, total_score: v.total_score ?? 0 }))
          )
        )
        .catch((e: string) => console.error("Failed to fetch versions", e));
    }
  }, [loadingEval, design?.id, selectedVersion?.id, fetchEvaluations]);

  useEffect(() => {
    const handler = async () => {
      setSoftRefreshing(true);
      try {
        await fetchEvaluations(selectedVersion?.id ?? null);
        router.refresh();
      } finally {
        setSoftRefreshing(false);
      }
    };
    window.addEventListener("uxhibit:soft-refresh", handler);
    return () => window.removeEventListener("uxhibit:soft-refresh", handler);
  }, [router, fetchEvaluations, selectedVersion?.id]);

  useEffect(() => {
  if (loadingEval || !design?.id) return;
  (async () => {
    await fetchEvaluations(selectedVersion?.id ?? null);
    try {
      const vs = await fetchDesignVersions(design.id);
      setVersions(vs.map((v: any) => ({ ...v, total_score: v.total_score ?? 0 })));
      setAllVersions(vs);
    } catch (e) {
      console.error("Failed to fetch versions", e);
    }
  })();
}, [loadingEval, design?.id, selectedVersion?.id, fetchEvaluations]);

  useEffect(() => {
    if (!frameEvaluations.length) return;
    if (
      selectedFrameIndex < 0 ||
      selectedFrameIndex >= frameEvaluations.length
    ) {
      setSelectedFrameIndex(0);
    }
  }, [frameEvaluations.length, selectedFrameIndex]);

  // Use the live versions array for comparison availability
const compareDiag = useMemo(() => {
  const reasons: string[] = [];
  const count = versions?.length ?? 0; // was allVersions?.length
  if (count < 2) reasons.push(`only ${count} version(s) available`);
  if (!currentVersionScores?.id) reasons.push("missing currentVersionScores");
  return {
    canCompare: reasons.length === 0,
    why: reasons,
  };
}, [versions?.length, currentVersionScores?.id]);

  useEffect(() => {
    console.groupCollapsed("[page] Compare availability");
    console.log(
      "versions:",
      (allVersions || []).map((v) => ({ id: v.id, version: v.version }))
    );
    console.log("currentVersionScores:", currentVersionScores);
    console.log("previousVersionScores:", previousVersionScores);
    console.log(
      "canCompare:",
      compareDiag.canCompare,
      "reasons:",
      compareDiag.why
    );
    console.groupEnd();
  }, [
    allVersions,
    currentVersionScores,
    previousVersionScores,
    compareDiag.canCompare,
    compareDiag.why,
  ]);

  if (designLoading)
    return (
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
    );

  if (!design)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Design not found.</p>
      </div>
    );

  const isOwner =
    currentUserId && design?.id && currentUserId === design?.owner_id;

  const loadingScreenActive = loadingEval || designLoading;

  return (
    <div>
      {/* Re-evaluate loading bar */}
      {/* {loadingEval && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-[#232323] shadow-lg rounded-lg px-6 py-4 border border-orange-300 flex flex-col items-center">
          <Spinner className="w-6 h-6 mb-2" />
          <span className="font-semibold text-orange-600">
            AI re-evaluation in progress...
          </span>
          <span className="text-sm text-gray-600 mt-1"></span>
        </div>
      )} */}
      {compareMode && currentVersionScores && previousVersionScores && (
        <DesignComparison
          designId={design.id}
          currentVersionId={currentVersionScores.id}
          previousVersionId={previousVersionScores.id}
          onClose={() => setCompareMode(false)}
        />
      )}
      <div className="mb-2">
        <div className="flex gap-2 items-center justify-between w-full">
          <DesignHeaderTitle
            title={design.project_name}
            version={selectedVersion?.version?.toString() ?? ""}
            showVersion={!!selectedVersion}
            currentVersionId={design.current_version_id}
            selectedVersionId={selectedVersion?.id ?? null}
          />
          {isOwner && (
            <DesignHeaderActions
              handleShowVersions={handleShowVersions}
              handleOpenComments={handleOpenComments}
              showComments={showComments}
              setShowComments={setShowComments}
              comments={comments}
              loadingComments={loadingComments}
              showSearch={showSearch}
              setShowSearch={setShowSearch}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showSortOptions={showSortOptions}
              setShowSortOptions={setShowSortOptions}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              sortRef={sortRef}
              design={design}
              selectedVersion={selectedVersion}
              publishProject={publishProject}
              unpublishProject={unpublishProject}
              syncPublishedState={syncPublishedState}
              fetchWeaknesses={fetchWeaknesses}
              weaknesses={weaknesses}
              loadingWeaknesses={loadingWeaknesses}
              allVersions={allVersions}
              onToggleCompare={() => setCompareMode((v) => !v)}
              compareActive={compareMode}
              canCompare={compareDiag.canCompare}
              compareWhy={compareDiag.why.join("; ") || null}
            />
          )}
        </div>
      </div>
      <div className="mt-8">
        {/* TODO: Ongoing  */}
        {/* <DesignChats designId={design.id} currentUserId={currentUserId} /> */}
      </div>
      <div className="flex h-screen">
        {/* LEFT PANE OR IMAGE CONTAINER  */}
        <div className="flex-2 h-full border rounded-md bg-accent overflow-y-auto flex items-center justify-center relative">
          <ZoomControls
            zoom={zoom}
            setZoom={setZoom}
            setPan={setPan}
            pan={pan}
          />

          {/* Full overlay that covers the entire container */}
          {loadingScreenActive && (
            <div
              className="absolute inset-0 z-30 pointer-events-auto select-none overflow-hidden"
              role="status"
              aria-live="polite"
            >
              {/* Local keyframes (scoped) */}
              <style>{`
              @keyframes vignettePulse {
              0%,100% { opacity: .6; }
              50% { opacity: .85; }
              }
              @keyframes shineSweep {
              from { transform: translateX(-60%); }
              to { transform: translateX(40%); }
              }
              @keyframes progressStripes {from { background-position: 0 0; }
              to { background-position: 32px 0; }
              }@media (prefers-reduced-motion: reduce) {
              .anim-ok { animation: none !important; transition: none !important; }
              }
              `}</style>

              {/* Dim + blur backdrop */}
              <div className="absolute inset-0 bg-white/70 dark:bg-[#0f0f0f]/70 backdrop-blur-sm" />
              {/* Soft vignette (animation dialed for readability) */}
              <div
                className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_100%)] anim-ok"
                style={{ animation: "vignettePulse 3.5s ease-in-out infinite" }}
              />
              {/* Subtle diagonal sweep (softer in light mode for contrast) */}
              <div
                aria-hidden
                className="absolute inset-0 z-0 anim-ok"
                style={{
                  background:
                    "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
                  animation: "shineSweep 2.2s linear infinite",
                }}
              />

              {/* Center content: frosted card for readability */}
              <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
                <div className="relative w-[min(92vw,560px)] rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md shadow-xl ring-1 ring-black/5 dark:ring-white/5 p-6">
                  {/* Title/status line */}
                  <div className="text-center">
                    <div className="mx-auto inline-flex items-center justify-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full bg-[#ED5E20] shadow-[0_0_0_3px_rgba(237,94,32,0.15)] anim-ok"
                        style={{
                          animation: "vignettePulse 2s ease-in-out infinite",
                        }}
                      />
                      <span className="text-lg md:text-xl font-semibold text-neutral-800 dark:text-neutral-100 drop-shadow-[0_1px_0_rgba(0,0,0,.25)]">
                        {(() => {
                          if (!loadingEval) return "Summoning your frame ✨";
                          const tiers: Record<string, string[]> = {
                            t0: [
                              "Spinning up the vibe engine…",
                              "Booting heuristic hamster wheel…",
                              "Pixel cauldron preheating 🔥",
                              "Assembling UX atoms…",
                            ],
                            t25: [
                              "Blending clarity + chaos 🎨",
                              "Marinating accessibility sauce…",
                              "Teaching the AI manners 🤖",
                              "Refactoring your pixels' aura…",
                            ],
                            t50: [
                              "Mid-cook: tasting the layout stew 👅",
                              "Optimizing tap targets fr",
                              "Charting cognitive load maps 🗺️",
                              "Color contrast glow-up in progress…",
                            ],
                            t75: [
                              "Polishing heuristic halos ✨",
                              "Compressing insights into nuggets…",
                              "Almost vibed to perfection 😌",
                              "Wrapping semantic gifts 🎁",
                            ],
                            t100: [
                              "Finalizing score drop 🔥",
                              "Stamping UX passport ✅",
                              "Sealing insight scrolls 📜",
                              "Deploying vibe report…",
                            ],
                          };
                          const pick = (arr: string[]) =>
                            arr[Math.floor(Math.random() * arr.length)];
                          if (backendProgress < 25) return pick(tiers.t0);
                          if (backendProgress < 50) return pick(tiers.t25);
                          if (backendProgress < 75) return pick(tiers.t50);
                          if (backendProgress < 100) return pick(tiers.t75);
                          return pick(tiers.t100);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Center of the image here */}
          <div className="w-full h-full flex items-center justify-center">
            {loadingScreenActive ? (
              <div
                className="relative w-[600px] h-[400px] rounded-xl overflow-hidden border shadow bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-100 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${
                    pan.y / zoom
                  }px)`,
                  transformOrigin: "center center",
                  cursor:
                    zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default",
                }}
                onMouseDown={handlePanStart}
              />
            ) : (
              (() => {
                const showFigmaThumb = design?.fileKey
                  ? `/api/figma/thumbnail?fileKey=${design.fileKey}${
                      design.nodeId
                        ? `&nodeId=${encodeURIComponent(design.nodeId)}`
                        : ""
                    }`
                  : null;
                const imageSrc =
                  currentFrame?.thumbnail_url ||
                  thumbUrl ||
                  showFigmaThumb ||
                  "/images/design-thumbnail.png";
                const frameLabelIndex =
                  typeof (currentFrame as any)?.originalIndex === "number"
                    ? (currentFrame as any).originalIndex + 1
                    : selectedFrameIndex + 1;
                const imageAlt = currentFrame?.node_id
                  ? `Frame ${frameLabelIndex}`
                  : design?.project_name || "Design";
                return (
                  <Image
                    src={imageSrc}
                    alt={imageAlt}
                    width={600}
                    height={400}
                    className="w-full h-full object-contain"
                    style={{
                      opacity: 1,
                      transition: isPanning
                        ? "none"
                        : "opacity 0.3s, transform 0.2s",
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${
                        pan.y / zoom
                      }px)`,
                      transformOrigin: "center center",
                      cursor:
                        zoom > 1
                          ? isPanning
                            ? "grabbing"
                            : "grab"
                          : "default",
                    }}
                    onMouseDown={handlePanStart}
                    priority
                  />
                );
              })()
            )}
          </div>
        </div>

        {/* {!isOwner && <VisitorEngagement designId={design.id} />} */}
        <div>
          <button
            onClick={() => setShowEval((prev) => !prev)}
            className="p-2 rounded cursor-pointer"
          >
            {showEval ? (
              <IconLayoutSidebarRightCollapse size={22} />
            ) : (
              <IconLayoutSidebarRightExpand size={22} />
            )}
          </button>
        </div>

        <div
          style={{ cursor: "col-resize", width: 8 }}
          className="flex-shrink-0 bg-transparent hover:bg-orange-200 transition"
          onMouseDown={startResizing}
          aria-label="Resize evaluation sidebar"
          tabIndex={0}
          role="separator"
        />

        {/* RIGHT PANEL (Evaluation Sidebar) */}
        {showEval && sidebarWidth > 20 && (
          <div style={{ width: sidebarWidth }}>
            <div
              className="flex-1 bg-gray-50 border rounded-md dark:bg-[#1A1A1A] p-5 overflow-y-auto flex flex-col h-screen"
              style={{
                width: sidebarWidth,
                minWidth: minSidebarWidth,
                maxWidth: maxSidebarWidth,
              }}
            >
              {/* Tabs */}
              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <button
                  className={`text-lg font-semibold flex-1 text-center cursor-pointer
                          ${
                            sidebarTab === "ai"
                              ? "text-[#ED5E20] border-b-2 border-[#ED5E20]"
                              : "text-gray-500"
                          }`}
                  onClick={() => setSidebarTab("ai")}
                >
                  AI Evaluation
                </button>
                <button
                  className={`text-lg font-semibold flex-1 text-center cursor-pointer
                  ${
                    sidebarTab === "comments"
                      ? "text-[#ED5E20] border-b-2 border-[#ED5E20]"
                      : "text-gray-500"
                  }`}
                  onClick={() => setSidebarTab("comments")}
                >
                  Comments
                </button>
              </div>
              {sidebarTab === "ai" && (
                <>
                  {showVersionProgress && (
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
                              v{previousVersionScores?.version} → v
                              {currentVersionScores?.version}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setVpCollapsed((c) => !c)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                            bg-white/80 dark:bg-neutral-800/70 border border-orange-300/40 dark:border-orange-400/30
                            hover:bg-orange-50 dark:hover:bg-neutral-700 transition cursor-pointer"
                            aria-expanded={!vpCollapsed}
                            aria-label={
                              vpCollapsed
                                ? "Expand version progress"
                                : "Collapse version progress"
                            }
                          >
                            {vpCollapsed ? (
                              <Maximize2 className="h-3.5 w-3.5" />
                            ) : (
                              <Minimize2 className="h-3.5 w-3.5" />
                            )}
                            {vpCollapsed ? "Expand" : "Collapse"}
                          </button>
                        </div>

                        {/* Collapsible content */}
                        <div
                          className={`transition-all duration-500 ease-in-out ${
                            vpCollapsed
                              ? "max-h-0 opacity-0 pointer-events-none"
                              : "max-h-[560px] opacity-100"
                          }`}
                        >
                          {/* Overall comparison */}
                          <div className="grid grid-cols-3 gap-3 items-end mb-5 mt-3">
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-wide font-medium text-neutral-500 dark:text-neutral-400">
                                Previous
                              </p>
                              <div
                                className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${scoreTone(
                                  previousVersionScores?.overall
                                )}`}
                              >
                                {previousVersionScores?.overall ?? "—"}
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="flex items-center space-x-1"></div>
                              {(() => {
                                const oldVal = previousVersionScores?.overall;
                                const newVal = currentVersionScores?.overall;
                                if (
                                  typeof oldVal !== "number" ||
                                  typeof newVal !== "number"
                                ) {
                                  return (
                                    <p className="text-[10px] mt-1 text-neutral-500 dark:text-neutral-400 font-medium">
                                      —
                                    </p>
                                  );
                                }
                                const delta = newVal - oldVal;
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

                                return (
                                  <div className="relative grid place-items-center select-none">
                                    {/* Delta pill */}
                                    <div
                                      className={[
                                        "relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ring-1 shadow-sm",
                                        "transition-transform duration-300",
                                        "animate-[vpPopIn_.6s_ease-out_1]",
                                        badgeTone,
                                      ].join(" ")}
                                      title={`Overall change: ${
                                        delta > 0 ? "+" : ""
                                      }${delta}`}
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
                                      <span className="hidden sm:inline text-[10px] opacity-70">
                                        overall
                                      </span>
                                    </div>
                                    {/* Scoped keyframes (safe to duplicate) */}
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
                                );
                              })()}
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[10px] uppercase tracking-wide font-medium text-neutral-500 dark:text-neutral-400">
                                Current
                              </p>
                              <div
                                className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${scoreTone(
                                  currentVersionScores?.overall
                                )}`}
                              >
                                {currentVersionScores?.overall ?? "—"}
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
                              {Array.from(
                                new Set([
                                  ...Object.keys(
                                    previousVersionScores.categories
                                  ),
                                  ...Object.keys(
                                    currentVersionScores.categories
                                  ),
                                ])
                              )
                                .sort()
                                .map((cat) => {
                                  const oldVal =
                                    previousVersionScores?.categories[cat];
                                  const newVal =
                                    currentVersionScores?.categories[cat];
                                  const delta =
                                    typeof newVal === "number" &&
                                    typeof oldVal === "number"
                                      ? newVal - oldVal
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
                                        {typeof oldVal === "number"
                                          ? oldVal
                                          : "—"}
                                      </span>
                                      <span className="flex items-center justify-center">
                                        {diffArrow(newVal, oldVal)}
                                      </span>
                                      <span
                                        className={`text-right font-semibold ${
                                          newVal > (oldVal ?? -Infinity)
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : newVal < (oldVal ?? Infinity)
                                            ? "text-rose-500"
                                            : "text-neutral-500 dark:text-neutral-400"
                                        }`}
                                      >
                                        {typeof newVal === "number"
                                          ? newVal
                                          : "—"}
                                      </span>
                                      <span
                                        className={`text-[10px] text-right ${
                                          delta == null
                                            ? "text-neutral-400"
                                            : delta > 0
                                            ? "text-emerald-500"
                                            : delta < 0
                                            ? "text-rose-500"
                                            : "text-neutral-500 dark:text-neutral-400"
                                        }`}
                                      >
                                        {delta == null || isNaN(delta) ? (
                                          "—"
                                        ) : delta === 0 ? (
                                          <span
                                            className="inline-flex items-center justify-end gap-1 px-1.5 py-0.5
                                            text-neutral-600 dark:text-neutral-300"
                                            title="No change"
                                            aria-label="No change"
                                          >
                                            <Minus className="h-3 w-3 opacity-70" />
                                          </span>
                                        ) : (
                                          (delta > 0 ? "+" : "") + delta
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-neutral-600 dark:text-neutral-400">
                            {/* Delta legend chips */}
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

                              {/* Delta emphasis badge */}
                              {/* <span className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-400/10 dark:to-amber-400/10 text-orange-700 dark:text-orange-300 ring-1 ring-orange-400/20">
                                Δ change highlighted above
                              </span> */}
                            </div>

                            {/* Live tracking indicator */}
                            <div className="flex items-center gap-2">
                              <span
                                className="relative flex items-end gap-[3px] h-3"
                                aria-hidden
                              >
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
                  )}

                  <FrameNavigator
                    selectedFrameIndex={selectedFrameIndex}
                    setSelectedFrameIndex={setSelectedFrameIndex}
                    sortedFrameEvaluations={sortedFrameEvaluations}
                    filteredFrameEvaluations={filteredFrameEvaluations}
                  />

                  <div className="flex-1 overflow-y-auto pr-5 space-y-5">
                    {/* Error State */}
                    {evalError && (
                      <div className="text-red-500 text-sm">
                        Error: {evalError}
                      </div>
                    )}

                    {/* Results */}
                    {derivedEval && !loadingEval && (
                      <EvaluationResult
                        evalResult={derivedEval}
                        loadingEval={loadingEval}
                        currentFrame={currentFrame}
                        frameEvaluations={frameEvaluations}
                        selectedFrameIndex={selectedFrameIndex}
                      />
                    )}
                  </div>
                  {/* {isOwner && (
                  <div className="mt-auto pt-4">
                    <button
                      onClick={handleOpenEvalParams}
                      disabled={loadingEval}
                      className="w-full px-4 py-2 text-sm rounded-md bg-[#ED5E20] text-white hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                    >
                      {loadingEval ? "Evaluating..." : "Re-Evaluate"}
                    </button>
                    <EvaluationParamsModal
                      open={showEvalParams}
                      onClose={() => setShowEvalParams(false)}
                      onSubmit={(params) =>
                        handleEvalParamsSubmit(
                          params,
                          handleEvaluateWithParams,
                          design,
                          setLoadingEval,
                          setEvalError,
                          setEvalResult,
                          setFrameEvaluations,
                          setExpectedFrameCount,
                          setEvaluatedFramesCount,
                          fetchEvaluations,
                          setShowEvalParams,
                        )
                      }
                      initialParams={pendingParams || {}}
                    />
                  </div>
                )} */}

                  {isOwner && (
                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        onClick={async () => {
                          if (loadingEval) return;
                          if (pendingParams) {
                            await handleEvalParamsSubmit(
                              pendingParams,
                              handleEvaluateWithParams,
                              design,
                              setLoadingEval,
                              setEvalError,
                              setEvalResult,
                              setFrameEvaluations,
                              setExpectedFrameCount,
                              setEvaluatedFramesCount,
                              fetchEvaluations,
                              setShowEvalParams
                            );
                          } else {
                            handleOpenEvalParams();
                          }
                        }}
                        disabled={loadingEval}
                        aria-busy={loadingEval}
                        className={`cursor-pointer relative flex-1 inline-flex items-center justify-center rounded-xl text-sm transition-all duration-300 h-12 overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 group/button w-full ${
                          loadingEval
                            ? // use the "Cancel" button colors when evaluating (cursor disabled)
                              "flex-1 inline-flex items-center justify-center rounded-xl text-sm font-medium border border-neutral-300/70 dark:border-neutral-600/60 bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-200 shadow-sm backdrop-blur transition-colors h-12 cursor-not-allowed opacity-90"
                            : // default gradient "Re-Evaluate" appearance
                              "text-white font-semibold tracking-wide"
                        }`}
                      >
                        {loadingEval ? (
                          // plain neutral appearance while evaluating
                          <span className="relative z-10">Evaluating...</span>
                        ) : (
                          <>
                            {/* Gradient background */}
                            <span
                              aria-hidden
                              className="absolute inset-0 bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b] transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* Glass effect overlay */}
                            <span
                              aria-hidden
                              className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06))] backdrop-blur-[2px]"
                            />

                            {/* Light sweep animation */}
                            <span
                              aria-hidden
                              className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover/button:translate-x-[220%] group-hover/button:opacity-70"
                            />

                            <span className="relative z-10 flex items-center gap-2">
                              <span>Re-Evaluate</span>
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
              {sidebarTab === "comments" && (
                <div className="flex-1 flex flex-col">
                  <CommentsSection
                    comments={comments}
                    newCommentText={newCommentText}
                    setNewCommentText={setNewCommentText}
                    currentUserId={currentUserId}
                    handleAddComment={handleAddComment}
                    handleAddReply={handleAddReply}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    replyingToId={replyingToId}
                    setReplyingToId={setReplyingToId}
                    handleDeleteComment={handleDeleteComment}
                    postingComment={postingComment}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {sidebarWidth <= 20 && (
          <button
            onClick={() => {
              setSidebarWidth(700);
              setShowEval(true);
            }}
            className="absolute top-1/2 right-0 z-50 bg-[#ED5E20] text-white rounded-l px-2 py-1 shadow -translate-y-1/2"
            aria-label="Show Evaluation Sidebar"
          >
            <IconLayoutSidebarRightExpand size={22} />
          </button>
        )}
      </div>
      {showVersions && (
        <VersionHistoryModal
          open={showVersions}
          onClose={() => setShowVersions(false)}
          loadingVersions={loadingVersions}
          versions={versions}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          design={design}
          selectedVersion={selectedVersion}
          setSelectedVersion={setSelectedVersion}
          fetchDesignVersions={fetchDesignVersions}
          fetchWeaknesses={fetchWeaknesses}
          deleteDesignVersion={deleteDesignVersion}
          setVersions={setVersions}
          setVersionChanged={setVersionChanged}
          setEvalResult={setEvalResult}
          setShowEval={setShowEval}
          setFrameEvaluations={setFrameEvaluations}
          setSelectedFrameIndex={setSelectedFrameIndex}
        />
      )}
    </div>
  );
}
