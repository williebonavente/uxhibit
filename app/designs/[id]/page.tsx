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
import { ReadingsPanel } from "./dialogs/ReadingPanel";
import { GradientActionButton } from "@/components/gradient-action-btn";
import { VersionProgress } from "./dialogs/VersionProgress";
import { ReEvaluatePanel } from "./dialogs/ReEvaluatePanel";
import { ReEvaluateModal } from "./dialogs/ReEvaluateModal";
import { LoadingOverlay } from "./dialogs/LoadingOverlay";

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

  const figmaUrl =
    (input.url && input.url.trim()) ||
    (input.fileKey
      ? `https://www.figma.com/file/${input.fileKey}${
          input.nodeId ? `?node-id=${encodeURIComponent(input.nodeId)}` : ""
        }`
      : "");

  if (!figmaUrl) {
    throw new Error(
      "Missing Figma link. Provide input.url or input.fileKey to evaluate."
    );
  }

  const payload = {
    method: "link" as const,
    url: figmaUrl,
    designId: input.designId,
    versionId: input.versionId,
    snapshot: input.snapshot,
    meta: {
      file_key: input.fileKey,
      node_id: input.nodeId,
      thumbnail_url: input.fallbackImageUrl,
    },
  };

  const res = await fetch(`${baseUrl}/api/ai/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
  const [sidebarTab, setSidebarTab] = useState<"ai" | "comments" | "readings">(
    "ai"
  );
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
  const [imageError, setImageError] = useState(false);
  const [showReEvalPanel, setShowReEvalPanel] = useState(false);
  const [showReEvalModal, setShowReEvalModal] = useState(false);
  const [reEvalUrl, setReEvalUrl] = useState("");
  const [reEvalImages, setReEvalImages] = useState<File[]>([]);
  const [reEvalUploading, setReEvalUploading] = useState(false);

  async function uploadLocalImages(files: File[]): Promise<string[]> {
    if (!files.length) return [];
    const supabase = createClient();
    setReEvalUploading(true);
    const urls: string[] = [];
    for (const f of files) {
      const filePath = `manual-eval/${design?.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${f.name}`;
      const { error } = await supabase.storage
        .from("design-temp")
        .upload(filePath, f, {
          cacheControl: "3600",
          upsert: false,
        });
      if (error) {
        console.warn("Upload failed:", error.message);
        continue;
      }
      const { data: signed } = await supabase.storage
        .from("design-temp")
        .createSignedUrl(filePath, 3600);
      if (signed?.signedUrl) urls.push(signed.signedUrl);
    }
    setReEvalUploading(false);
    return urls;
  }

  async function handleCustomReEvaluate() {
    if (!design?.id || !design?.fileKey) {
      toast.error("Missing design base data.");
      return;
    }
    if (!reEvalUrl && !reEvalImages.length) {
      toast.error("Provide a Figma link or upload at least one image.");
      return;
    }
    setLoadingEval(true);
    setEvalError(null);

    try {
      let imageUrlForAI: string | undefined;
      let uploadedImageUrls: string[] = [];
      if (reEvalImages.length) {
        uploadedImageUrls = await uploadLocalImages(reEvalImages);
        imageUrlForAI = uploadedImageUrls[0];
      } else {
        imageUrlForAI = design.thumbnail;
        if (imageUrlForAI && !imageUrlForAI.startsWith("http")) {
          const supabase = createClient();
          const { data: signed } = await supabase.storage
            .from("design-thumbnails")
            .createSignedUrl(imageUrlForAI, 3600);
          if (signed?.signedUrl) imageUrlForAI = signed.signedUrl;
        }
      }

      const frameIds = design?.frames?.map((f) => String(f.id)) ?? [];

      const data = await evaluateDesign({
        designId: design.id,
        fileKey: design.fileKey,
        nodeId: design.nodeId,
        fallbackImageUrl: imageUrlForAI,
        snapshot:
          typeof design.snapshot === "string"
            ? JSON.parse(design.snapshot)
            : design.snapshot,
        url: reEvalUrl || design.figma_link,
        frameIds,
        versionId: design.current_version_id || "",
      });

      setEvalResult(data[0]);
      toast.success("Re-evaluation completed.");
      setShowReEvalPanel(false);
      setReEvalImages([]);
      setReEvalUrl("");

      try {
        const supabase = createClient();
        const { data: updatedDesign } = await supabase
          .from("designs")
          .select("id, current_version_id")
          .eq("id", design.id)
          .single();
        if (updatedDesign?.current_version_id) {
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
        console.warn("Could not refresh version id after re-eval:", err);
      }
      setLoadingVersions(true);
    } catch (e: any) {
      console.error("Custom re-evaluate failed:", e);
      setEvalError(e.message || "Failed custom re-evaluation");
      toast.error("Failed re-evaluation.");
    } finally {
      setLoadingEval(false);
      setLoadingVersions(false);
    }
  }

  function startResizing() {
    setIsResizing(true);
  }

  useEffect(() => {
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

  function handlePanStart(e: MouseEvent) {
    if (zoom === 1) return;
    setIsPanning(true);
    panStart.current = { ...pan };
    mouseStart.current = { x: e.clientX, y: e.clientY };
  }

  const handlePanMove = useCallback(
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

  const fetchEvaluations = useCallback(
    async (overrideVersionId?: string | null) => {
      const supabase = createClient();
      console.log(
        "[fetchEvaluations] Fetching version for design:",
        design?.id,
        "overrideVersionId:",
        overrideVersionId
      );

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

      if (typeof dbg?.combined === "number") return dbg.combined;
      if (typeof dbg?.final === "number") return dbg.final;

      if (typeof root?.overall_score === "number") return root.overall_score;
      if (typeof f.total_score === "number") return f.total_score;

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

  const computeFrameScoreFromAi = React.useCallback((root: any): number => {
    if (!root || typeof root !== "object") return 0;
    const dbg = root?.debug_calc;

    let heurAvg: number | undefined =
      typeof dbg?.heuristics_avg === "number" ? dbg.heuristics_avg : undefined;
    if (heurAvg === undefined) {
      const hb: any[] = Array.isArray(root?.heuristic_breakdown)
        ? root.heuristic_breakdown
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

    const cs =
      root?.category_scores && typeof root.category_scores === "object"
        ? root.category_scores
        : undefined;
    const catVals = cs
      ? Object.values(cs).filter(
          (v: any): v is number => typeof v === "number" && Number.isFinite(v)
        )
      : [];
    const catAvg = catVals.length
      ? Math.round(
          catVals.reduce((a: number, b: number) => a + b, 0) / catVals.length
        )
      : undefined;

    const biasWeighted =
      typeof dbg?.bias_weighted_overall === "number"
        ? dbg.bias_weighted_overall
        : typeof root?.bias?.weighted_overall === "number"
        ? root.bias.weighted_overall
        : undefined;

    const tri =
      typeof heurAvg === "number" &&
      typeof catAvg === "number" &&
      typeof biasWeighted === "number"
        ? Math.round((heurAvg + catAvg + biasWeighted) / 3)
        : undefined;

    if (typeof tri === "number") return tri;
    if (typeof dbg?.final === "number") return dbg.final;
    if (typeof root?.overall_score === "number") return root.overall_score;
    if (typeof catAvg === "number" && typeof heurAvg === "number")
      return Math.round((catAvg + heurAvg) / 2);
    if (typeof catAvg === "number") return catAvg;
    if (typeof heurAvg === "number") return heurAvg;
    return 0;
  }, []);

  const parseVersionScores = React.useCallback(
    (v: any): ParsedVersionData | null => {
      if (!v) return null;

      const persisted =
        typeof v.total_score === "number" && v.total_score > 0
          ? Math.round(v.total_score)
          : undefined;

      let raw = v.ai_data;
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch {
          return {
            id: v.id,
            version: v.version,
            overall: persisted,
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
            return keys.sort((a, b) => Number(a) - Number(b)).map((k) => x[k]);
          }
          if (Array.isArray(x.frames)) return x.frames;
          return [x];
        }
        return [];
      };

      const entries = toEntries(raw).map((e) =>
        e && typeof e === "object" && "ai" in e ? e.ai : e
      );

      const frameScores: number[] = [];
      const perCategory: Record<string, { sum: number; n: number }> = {};

      entries.forEach((root) => {
        if (!root || typeof root !== "object") return;
        const score = computeFrameScoreFromAi(root);
        if (score > 0) frameScores.push(score);

        const cats = root?.category_scores;
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

      if (!entries.length && raw && typeof raw === "object") {
        const root: any = (raw as any).ai ?? raw;
        const loneScore = computeFrameScoreFromAi(root);
        if (loneScore > 0) frameScores.push(loneScore);
        const cats = root?.category_scores;
        if (cats && typeof cats === "object") {
          Object.entries(cats).forEach(([k, val]) => {
            if (typeof val === "number" && Number.isFinite(val)) {
              perCategory[k] = { sum: val, n: 1 };
            }
          });
        }
      }

      const avg = (arr: number[]) =>
        arr.length
          ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
          : undefined;
      const recomputed = avg(frameScores);
      const overall = persisted ?? recomputed ?? undefined;

      const categories: Record<string, number> = {};
      Object.entries(perCategory).forEach(([k, { sum, n }]) => {
        categories[k] = Math.round(sum / Math.max(1, n));
      });

      return { id: v.id, version: v.version, overall, categories };
    },
    [computeFrameScoreFromAi]
  );

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
  }, [versions, selectedVersion, parseVersionScores]);

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
        setVersions(
          vs.map((v: any) => ({ ...v, total_score: v.total_score ?? 0 }))
        );
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

  useEffect(() => {
    setImageError(false);
  }, [currentFrame?.thumbnail_url, thumbUrl, design?.fileKey, design?.nodeId]);

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
          <LoadingOverlay
            active={loadingScreenActive}
            loadingEval={loadingEval}
            backendProgress={backendProgress}
          />
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

                // Fallback: show centered "failed fetch" visual
                if (imageError) {
                  return (
                    <div
                      className="flex flex-col items-center justify-center text-center p-6"
                      style={{
                        transform: `scale(${zoom}) translate(${
                          pan.x / zoom
                        }px, ${pan.y / zoom}px)`,
                        transformOrigin: "center center",
                        cursor:
                          zoom > 1
                            ? isPanning
                              ? "grabbing"
                              : "grab"
                            : "default",
                      }}
                      onMouseDown={handlePanStart}
                    >
                      <Image
                        src="/images/fetch-failed_1.png"
                        alt="Failed to load design"
                        width={480}
                        height={360}
                        className="object-contain opacity-90"
                        priority
                      />

                      <div className="mt-2 flex gap-2">
                        {/* <button
                type="button"
                className="px-3 py-1.5 rounded-md text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition cursor-pointer"
                onClick={() => setImageError(false)}
                title="Retry image load"
              >
                Retry
              </button> */}
                        <div
                          role="status"
                          aria-live="polite"
                          className="px-3 py-1.5 rounded-md text-sm bg-amber-100 text-amber-800 border border-amber-300/60
                           dark:bg-amber-400/15 dark:text-amber-200"
                        >
                          Please try again some later!
                        </div>
                      </div>
                    </div>
                  );
                }

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
                    onError={() => setImageError(true)}
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
                {/* Readings tab */}
                {isOwner && (
                  <button
                    className={`text-lg font-semibold flex-1 text-center cursor-pointer
                      ${
                        sidebarTab === "readings"
                          ? "text-[#ED5E20] border-b-2 border-[#ED5E20]"
                          : "text-gray-500"
                      }`}
                    onClick={() => setSidebarTab("readings")}
                  >
                    Readings
                  </button>
                )}
                {/* Comments Tab */}
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
                  {showVersionProgress &&
                    previousVersionScores &&
                    currentVersionScores && (
                      <VersionProgress
                        previous={previousVersionScores}
                        current={currentVersionScores}
                        collapsed={vpCollapsed}
                        onToggle={() => setVpCollapsed((c) => !c)}
                      />
                    )}

                  {/* Hide navigator during re-evaluation */}
                  {!loadingEval && (
                    <FrameNavigator
                      selectedFrameIndex={selectedFrameIndex}
                      setSelectedFrameIndex={setSelectedFrameIndex}
                      sortedFrameEvaluations={sortedFrameEvaluations}
                      filteredFrameEvaluations={filteredFrameEvaluations}
                    />
                  )}

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

                  {isOwner && !imageError && (
                    <div className="mt-auto pt-4">
                      <GradientActionButton
                        loading={loadingEval}
                        loadingText="Evaluating..."
                        onClick={async () => {
                          if (loadingEval) return;
                          setShowReEvalModal(true);
                        }}
                        className="w-full"
                      >
                        Re-Evaluate
                      </GradientActionButton>
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

              {sidebarTab === "readings" && isOwner && (
                <ReadingsPanel snapshot={design?.snapshot as any} />
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

      {isOwner && (
        <ReEvaluateModal
          open={showReEvalModal}
          onClose={() => setShowReEvalModal(false)}
          reEvalUrl={reEvalUrl}
          setReEvalUrl={setReEvalUrl}
          reEvalImages={reEvalImages}
          setReEvalImages={setReEvalImages}
          loadingEval={loadingEval}
          reEvalUploading={reEvalUploading}
          onRun={async () => {
            await handleCustomReEvaluate();
            setShowReEvalModal(false);
          }}
          onCancel={() => {
            setShowReEvalModal(false);
            setReEvalImages([]);
            setReEvalUrl("");
          }}
        />
      )}
    </div>
  );
}
