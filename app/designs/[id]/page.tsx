"use client";

import React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import EvaluationResult from "./dialogs/EvaluationResult";
import FrameNavigator from "./dialogs/FrameNavigator";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner/index";
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

interface FrameEvaluation {
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
};

export type HeuristicBreakdownItem = {
  code: string;
  score: number;
  principle: string;
  max_points: number;
  justification?: string;
  evaluation_focus?: string;
}

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
    category_scores?: Record<string, number>;
    category_score_justifications?: Record<string, string>;
    resources?: EvalResource[];
    heuristic_breakdown?: HeuristicBreakdownItem[];
  } | null;
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

  const fetchEvaluations = React.useCallback(async () => {
    const supabase = createClient();
    console.log(
      "[fetchEvaluations] Fetching latest version for design:",
      design?.id
    );

    // 1. Fetch the latest version for this design
    const { data: versionData, error: versionError } = await supabase
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

    if (versionError) {
      console.error(
        "[fetchEvaluations] Failed to fetch overall evaluation:",
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

    // If the latest version hasn't changed since last fetch, skip updating state
    if (
      lastVersionIdRef.current &&
      lastVersionIdRef.current === String(versionData.id)
    ) {
      console.log(
        "[fetchEvaluations] Version unchanged, skipping update:",
        versionData.id
      );
      return;
    }
    // HOTFIX: Filter out incomplete/placeholder versions
    if (
      !versionData.ai_summary ||
      !versionData.ai_data ||
      typeof versionData.total_score !== "number" ||
      versionData.total_score === 0
    ) {
      console.warn(
        "[fetchEvaluations] Skipping incomplete/placeholder version:",
        versionData
      );
      setFrameEvaluations([]);
      return;
    }

    console.log("[fetchEvaluations] Latest version data:", versionData);

    // 2. Parse AI data for the overall frame
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

    const overall: FrameEvaluation = {
      id: "overallFrame",
      design_id: versionData.design_id,
      version_id: versionData.id,
      file_key: versionData.file_key,
      node_id: versionData.node_id,
      thumbnail_url: versionData.thumbnail_url,
      owner_id: versionData.created_by,
      ai_summary: versionData.ai_summary,
      ai_data: aiData,
      snapshot: versionData.snapshot,
      created_at: versionData.created_at,
      updated_at: versionData.updated_at,
      total_score: versionData.total_score,
    };

    // 3. Fetch all frames for this version
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
      setFrameEvaluations([overall]);
      return;
    }

    console.log("[fetchEvaluations] Frame data for version:", frameData);

    const frames = (frameData || []).map((frame: any) => ({
      ...frame,
      ai_data:
        typeof frame.ai_data === "string"
          ? JSON.parse(frame.ai_data)
          : frame.ai_data,
    }));

    // 4. Combine overall and frames
    const combined = [overall, ...frames];
    // only set state if different (avoids rerenders that retrigger fetches)
    if (
      lastVersionIdRef.current !== String(versionData.id) ||
      JSON.stringify(frameEvaluations) !== JSON.stringify(combined)
    ) {
      setFrameEvaluations(combined);
      lastVersionIdRef.current = String(versionData.id);
      console.log(
        "[fetchEvaluations] Combined frame evaluations set:",
        combined
      );
    } else {
      console.log(
        "[fetchEvaluations] Combined evaluations identical, not updating state."
      );
    }
    console.log("[fetchEvaluations] Combined frame evaluations set:", combined);
  }, [design?.id, frameEvaluations]);

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
    const [overall, ...frames] = frameEvaluations;
    const sorted = [...frames].sort((a, b) => {
      const aScore = a.ai_data.overall_score ?? 0;
      const bScore = b.ai_data.overall_score ?? 0;
      return sortOrder === "asc" ? aScore - bScore : bScore - aScore;
    });
    return [overall, ...sorted];
  }, [frameEvaluations, sortOrder]);

  const filteredFrameEvaluations = React.useMemo(() => {
    if (!searchQuery.trim()) return sortedFrameEvaluations;
    return sortedFrameEvaluations.filter(
      (frame) =>
        frame.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        frame.ai_data.summary
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        frame.node_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedFrameEvaluations, searchQuery]);

  const currentFrame = sortedFrameEvaluations[selectedFrameIndex];

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
    const aiData = frame.ai_data ?? {};
    return {
      nodeId: frame.node_id,
      imageUrl: frame.thumbnail_url,
      summary: frame.ai_summary || aiData.summary || "",
      heuristics: null,
      ai_status: "ok",
      overall_score: aiData.overall_score ?? null,
      strengths: aiData.strengths ?? [],
      weaknesses: aiData.weaknesses ?? [],
      issues: (aiData.issues ?? []).map((issue, issueIdx) => ({
        ...issue,
        id: `frame${frameIdx}-issue${issueIdx}`,
        suggestions: issue.suggestion,
      })),
      category_scores: aiData.category_scores ?? null,
      ai: {
        ...aiData,
        issues: (aiData.issues ?? []).map((issue, issueIdx) => ({
          ...issue,
          id: `frame${frameIdx}-issue${issueIdx}`,
          suggestions: issue.suggestion,
        })),
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
    if (!design?.id) {
      console.log("[fetchEvaluations] No design id, skipping.");
      return;
    }
    fetchEvaluations();
  }, [design?.id, fetchEvaluations]);

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

  React.useEffect(() => {
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
    fetchEvaluations();
  }, [design?.id, fetchEvaluations, loadingEval]);

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

  return (
    <div>
      {/* Re-evaluate loading bar */}
      {loadingEval && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-[#232323] shadow-lg rounded-lg px-6 py-4 border border-orange-300 flex flex-col items-center">
          <Spinner className="w-6 h-6 mb-2" />
          <span className="font-semibold text-orange-600">
            AI re-evaluation in progress...
          </span>
          <span className="text-sm text-gray-600 mt-1"></span>
        </div>
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
              
            />
          )}
        </div>
      </div>
      <div className="mt-8">
        {/* TODO: Ongoing  */}
        {/* <DesignChats designId={design.id} currentUserId={currentUserId} /> */}
      </div>
      <div className="flex h-screen">
        <div className="flex-2 h-full border rounded-md bg-accent overflow-y-auto flex items-center justify-center relative">
          {designLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-[#232323]/80 z-20 rounded-md animate-fade-in-up">
              <Spinner className="w-12 h-12 text-[#ED5E20] animate-spin mb-4" />
              <span className="text-lg font-semibold text-[#ED5E20] animate-pulse">
                Loading your design...
              </span>
              <span className="text-sm text-gray-400 mt-2">
                Please wait while we fetch your frame.
              </span>
            </div>
          )}
          <ZoomControls
            zoom={zoom}
            setZoom={setZoom}
            setPan={setPan}
            pan={pan}
          />
          {/* Center of the image here */}
          <Image
            src={
              selectedFrameIndex === 0
                ? thumbUrl
                  ? thumbUrl
                  : design.fileKey
                  ? `/api/figma/thumbnail?fileKey=${design.fileKey}${
                      design.nodeId
                        ? `&nodeId=${encodeURIComponent(design.nodeId)}`
                        : ""
                    }`
                  : "/images/design-thumbnail.png"
                : frameEvaluations[selectedFrameIndex]?.thumbnail_url
                ? frameEvaluations[selectedFrameIndex].thumbnail_url
                : "/images/design-thumbnail.png"
            }
            alt={
              selectedFrameIndex === 0
                ? "Overall"
                : frameEvaluations[selectedFrameIndex]?.node_id
                ? `Frame ${selectedFrameIndex}`
                : design.project_name || "Design"
            }
            width={600}
            height={400}
            className="w-full h-full object-contain"
            style={{
              opacity: designLoading ? 0.5 : 1,
              transition: isPanning ? "none" : "opacity 0.3s, transform 0.2s",
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${
                pan.y / zoom
              }px)`,
              transformOrigin: "center center",
              cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default",
            }}
            onMouseDown={handlePanStart}
          />
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
                    {evalResult && !loadingEval && (
                      <EvaluationResult
                        evalResult={evalResult}
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
        />
      )}
    </div>
  );
}
