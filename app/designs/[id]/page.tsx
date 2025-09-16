"use client";

import React from "react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import EvaluationResult from "./dialogs/EvaluationResult";
import FrameNavigator from "./dialogs/FrameNavigator";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner/index";
import { fetchDesignVersions, deleteDesignVersion } from "@/database/actions/versions/versionHistory";

import { toast } from "sonner";
import VersionHistoryModal from "./dialogs/VersionHistoryModal";
import DesignHeaderActions from "./dialogs/DesignHeader";
import ZoomControls from "./dialogs/ZoomControls";
import { CommentsSection } from "./comments/page";
import { Comment } from "@/components/comments-user";


interface FrameEvaluation {
  id: string;
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

type Snapshot = {
  age: string;
  occupation: string;
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
  frames?: { id: string | number; name: string;[key: string]: any }[];
};

type EvaluateInput = {
  designId: string;
  fileKey: string
  nodeId?: string;
  scale?: number;
  fallbackImageUrl?: string;
  snapshot: Snapshot;
}

type EvalResponse = {
  nodeId: string;
  imageUrl: string;
  summary: string;
  heuristics: any;
  ai_status?: "ok" | "skipped";
  overall_score?: number | null;
  strengths?: string[];
  weaknesses?: string[]; // added
  issues?: {
    id: string;
    severity: string;
    message: string;
    suggestion: string;
  }[];
  category_scores?: Record<string, number> | null;
  ai?: {
    overall_score?: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[]; // added
    issues?: {
      id: string;
      severity: string;
      message: string;
      suggestions: string;
    }[];
    category_scores?: Record<string, number>;
  } | null;
};

export async function evaluateDesign(input: EvaluateInput): Promise<EvalResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log('Calling evaluate with:', input);

  const res = await fetch(`${baseUrl}/api/ai/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  console.log('Evaluate response:', data);

  if (!res.ok) {
    console.error('Evaluate failed:', data);
    throw new Error(data?.error || "Failed to evaluate");
  }
  return data as EvalResponse;
}

export default function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

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
  const [frameEvaluations, setFrameEvaluations] = useState<FrameEvaluation[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default");
  const [showSortOptions, setShowSortOptions] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ fullName: string; avatarUrl: string } | null>(null);

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

  const pageSize = 6;
  const sortRef = useRef<HTMLDivElement>(null);

  function startResizing(e: React.MouseEvent) {
    setIsResizing(true);
  }

  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX - 8;
      setSidebarWidth(Math.max(minSidebarWidth, Math.min(maxSidebarWidth, newWidth)));
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

  function handlePanMove(e: MouseEvent) {
    if (!isPanning) return;
    const dx = e.clientX - mouseStart.current.x;
    const dy = e.clientY - mouseStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  }

  function handlePanEnd() {
    setIsPanning(false);
  }

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
    return sortedFrameEvaluations.filter(frame =>
      frame.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      frame.ai_data.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      frame.node_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedFrameEvaluations, searchQuery]);

  const currentFrame = sortedFrameEvaluations[selectedFrameIndex];

  async function handleOpenComments() {
    setShowComments(true);
    setLoadingComments(true);

    const supabase = createClient();

    // Mark unread the default notification
    if (currentUserId && design?.id) {
      await supabase
      .from("comments")
      .update({ is_read: true})
      .eq("design_id", design.id)
      .eq("user_id", currentUserId)
      .eq("is_read", false);
    }
    const { data, error } = await supabase
      .from("comments")
      .select(`id, text, user_id, created_at, local_time, 
              is_read,
              parent_id, 
              updated_at, 
              design_id`)
      .eq("design_id", design?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Map data to your Comment[] shape
      const mappedComments = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: userData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", comment.user_id)
            .single();
          return {
            id: comment.id,
            text: comment.text,
            user: {
              id: comment.user_id,
              fullName: userData?.full_name || "",
              avatarUrl: userData?.avatar_url || "",
            },
            replies: [],
            parentId: comment.parent_id,
            createdAt: new Date(comment.created_at),
            updatedAt: comment.updated_at ? new Date(comment.updated_at) : undefined,
            localTime: comment.local_time,
            design_id: comment.design_id,
            is_read: comment.is_read,
          };
        })
      );

      const commentMap: { [id: string]: any } = {};
      mappedComments.forEach(comment => {
        commentMap[comment.id] = { ...comment, replies: [] };
      });
      const rootComments: any[] = [];
      mappedComments.forEach(comment => {
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

  async function markCommentAsRead(id: string) {
  const supabase = createClient();
  await supabase.from("comments").update({ is_read: true }).eq("id", id);
  // Optionally refresh comments here
}
async function markCommentAsUnread(id: string) {
  const supabase = createClient();
  await supabase.from("comments").update({ is_read: false }).eq("id", id);
  // Optionally refresh comments here
}


  const handleShowVersions = async () => {
    setShowVersions(true);
    setLoadingVersions(true);
    if (design?.id) {
      fetchDesignVersions(design.id)
        .then(setVersions)
        .catch((e: string) => console.error("Failed to fetch versions", e))
        .finally(() => setLoadingVersions(false));
    } else {
      setLoadingVersions(false);
    }
  }
  async function handleEvaluate() {
    if (!design?.id || !design?.fileKey) {
      console.error('Missing required design data:', { id: design?.id, fileKey: design?.fileKey });
      setEvalError("Missing required design data");
      return;
    }

    setLoadingEval(true);
    setEvalError(null);

    try {
      let imageUrlForAI = design.thumbnail;
      if (imageUrlForAI && !imageUrlForAI.startsWith('http')) {
        const supabase = createClient();
        const { data: signed } = await supabase.storage
          .from("design-thumbnails")
          .createSignedUrl(imageUrlForAI, 3600);

        if (signed?.signedUrl) {
          imageUrlForAI = signed.signedUrl;
        }
      }

      console.log('Starting evaluation with:', {
        designId: design.id,  // Make sure this exists
        fileKey: design.fileKey,
        nodeId: design.nodeId,
        thumbnail: design.thumbnail,
        snapshot: design.snapshot,
      });

      const data = await evaluateDesign({
        designId: design.id,
        fileKey: design.fileKey,
        nodeId: design.nodeId,
        scale: 3,
        fallbackImageUrl: imageUrlForAI, // Use the signed URL here
        snapshot: typeof design?.snapshot === "string" ? JSON.parse(design.snapshot) : design?.snapshot,
      });


      console.log('Evaluation successful:', data);
      setEvalResult(data);

      try {
        const supabase = createClient();
        const { data: updatedDesign, error } = await supabase
          .from("designs")
          .select("id, current_version_id")
          .eq("id", design.id)
          .single();
        if (!error && updatedDesign) {
          setDesign((prev) => prev ? { ...prev, current_version_id: updatedDesign.current_version_id } : prev);
        }
      } catch (err) {
        console.error("Failed to refresh current_version_id after evaluation:", err);
      }
      setLoadingVersions(true);
    } catch (e: any) {
      console.error('Evaluation failed:', e);
      setEvalError(e.message || "Failed to evaluate");
    } finally {
      setLoadingEval(false);
      setLoadingVersions(false);

    }
  }
  async function syncPublishedState(): Promise<void> {
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
  }
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
      ({ error } = await supabase
        .from("published_designs")
        .insert({
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
      toast.error(`Failed to publish design: ${error.message || "Unknown error"}`);
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
      // Instantly update local state so UI reflects unpublished status
      setDesign((prev) =>
        prev ? { ...prev, is_active: false } : prev
      );
      toast.success("Design unpublished!");
    } else {
      toast.error(`Failed to unpublish design: ${error.message || "Unknown error"}`);
    }
  }
  function mapFrameToEvalResponse(frame: FrameEvaluation, frameIdx = 0): EvalResponse {
    return {
      nodeId: frame.node_id,
      imageUrl: frame.thumbnail_url,
      summary: frame.ai_summary || frame.ai_data.summary,
      heuristics: null,
      ai_status: "ok",
      overall_score: frame.ai_data.overall_score ?? null,
      strengths: frame.ai_data.strengths,
      weaknesses: frame.ai_data.weaknesses,
      issues: (frame.ai_data.issues ?? []).map((issue, issueIdx) => ({
        ...issue,
        id: `frame${frameIdx}-issue${issueIdx}`,
        suggestions: issue.suggestion,
      })),
      category_scores: frame.ai_data.category_scores,
      ai: {
        ...frame.ai_data,
        issues: (frame.ai_data.issues ?? []).map((issue, issueIdx) => ({
          ...issue,
          id: `frame${frameIdx}-issue${issueIdx}`,
          suggestions: issue.suggestion,
        })),
      },
    };
  }


  const handleAddComment = async () => {
    const supabase = createClient();
    if (!newCommentText.trim() || !currentUserId || !currentUserProfile || !design) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          user_id: currentUserId,
          design_id: design.id,
          text: newCommentText,
          parent_id: null,
          local_time: new Date().toLocaleTimeString(),
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error("Failed to add comment!");
      console.error(error.message);
      return;
    }

    setNewCommentText("");
  };

  const handleDeleteComment = (id: string) => {
    setComments(comments.filter(comment => comment.id !== id));
  }

  useEffect(() => {
    const supabase = createClient();
    async function fetchUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      if (user?.id) {
        // Adjust this query to match your user profile table/fields
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        setCurrentUserProfile({
          fullName: profile?.full_name ?? "Unknown",
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
    if (design) {
      syncPublishedState();
    }
  }, [design?.id]);

  useEffect(() => {
    async function loadDesign() {
      setDesignLoading(true);
      try {
        const supabase = createClient();
        // Modify the query to include AI evaluation data
        const { data, error } = await supabase
          .from("designs")
          .select(`
            id, title, figma_link,file_key,
            node_id, thumbnail_url,
            current_version_id,
            owner_id,
            design_versions!design_versions_design_id_fkey (
              id, file_key, node_id, thumbnail_url, total_score,
              ai_summary, ai_data, snapshot,created_at,
              version
            )
          `)
          .eq("id", id)
          .order('created_at', { foreignTable: 'design_versions', ascending: false })
          .limit(1, { foreignTable: 'design_versions' })
          .single();

        if (!error && data) {
          const latestVersion = data.design_versions?.[0];
          // Parse the JSONB data
          let parsedAiData = null;
          if (latestVersion?.ai_data) {
            try {
              // Handle both string and object formats
              parsedAiData = typeof latestVersion.ai_data === 'string'
                ? JSON.parse(latestVersion.ai_data)
                : latestVersion.ai_data;

              console.log('Parsed AI data:', parsedAiData);
            } catch (e) {
              console.error('Error parsing AI data:', e);
            }
          }

          // Set the design data
          const normalized: Design = {
            id: data.id,
            project_name: data.title,
            fileKey: latestVersion?.file_key || data.file_key || undefined,
            nodeId: latestVersion?.node_id || data.node_id || undefined,
            imageUrl: data.thumbnail_url || "/images/design-thumbnail.png",
            thumbnail: data.thumbnail_url || undefined,
            snapshot: latestVersion?.snapshot || null,
            current_version_id: data.current_version_id,
          };
          setDesign(normalized);

          if (latestVersion?.ai_data) {
            const overall: FrameEvaluation = {
              id: "overallFrame",
              design_id: design?.id,
              file_key: design?.fileKey || "",
              node_id: design?.nodeId || "",
              thumbnail_url: thumbUrl || design?.thumbnail || "",
              owner_id: data.owner_id || "",
              total_score: latestVersion?.total_score ?? null,
              ai_summary: latestVersion.ai_summary || parsedAiData.summary || "",
              ai_data: {
                overall_score:
                  parsedAiData.overall_score ??
                  latestVersion?.total_score ??
                  null,
                summary: parsedAiData.summary ?? "",
                strengths: parsedAiData.strengths ?? [],
                weaknesses: parsedAiData.weaknesses ?? [],
                issues: parsedAiData.issues ?? [],
                category_scores: parsedAiData.category_scores ?? null,
              },
              created_at: latestVersion.created_at,
              updated_at: latestVersion.created_at,
            };

            const frames = Array.isArray(parsedAiData) ? parsedAiData : [];
            const normalizedFrames = frames.map((frame) => ({
              ...frame,
              ai_data: frame.ai,
            }));
            setFrameEvaluations([overall, ...normalizedFrames]);
            setSelectedFrameIndex(0);
            setEvalResult(mapFrameToEvalResponse(overall));
            setShowEval(true);
          }

          if (data.thumbnail_url && !data.thumbnail_url.startsWith("http")) {
            const { data: signed } = await supabase.storage
              .from("design-thumbnails")
              .createSignedUrl(data.thumbnail_url, 3600);
            if (signed?.signedUrl) setThumbUrl(signed.signedUrl);
          }
        } else {
          console.error('Failed to load design:', error);
          setDesign(null);
        }
      } catch (err) {
        console.error('Error loading design:', err);
        setDesign(null);
      } finally {
        setDesignLoading(false);
      }
    }

    loadDesign();
  }, [id]);

  useEffect(() => {
    if (frameEvaluations[selectedFrameIndex]) {
      setEvalResult(mapFrameToEvalResponse(frameEvaluations[selectedFrameIndex], selectedFrameIndex));
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
  }, [designLoading, design, loadingEval, evalResult]);

  useEffect(() => {
    if (!design?.thumbnail || design.thumbnail.startsWith("http")) return;
    const supabaseClient = createClient();
    const refresh = async () => {
      const { data: signed } = await supabaseClient.storage
        .from("design-thumbnails")
        .createSignedUrl(design.thumbnail as string, 3600);
      if (signed?.signedUrl) setThumbUrl(signed.signedUrl);
    };
    // run once immediately
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
          .select(`
            node_id, 
            thumbnail_url, 
            ai_summary, 
            ai_data, 
            total_score,
            snapshot, 
            created_at
          `)
          .eq("design_id", design.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Failed to load evaluation:', error.message);
          return;
        }

        // Parse the JSONB ai_data
        let parsedAiData = null;
        if (data?.ai_data) {
          try {
            parsedAiData = typeof data.ai_data === 'string'
              ? JSON.parse(data.ai_data)
              : data.ai_data;

            console.log('Parsed saved AI data:', parsedAiData);
          } catch (err) {
            console.error('Error parsing saved AI data:', err);
          }
        }

        let snapshotParam = null;
        if (data?.snapshot) {
          try {
            snapshotParam = typeof data.snapshot === "string"
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
            summary: data?.ai_summary ?? parsedAiData.summary ?? parsedAiData.ai?.summary ?? "",
            heuristics: parsedAiData.heuristics ?? parsedAiData.ai?.heuristics ?? null,
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
            category_scores: parsedAiData.category_scores ?? parsedAiData.ai?.category_scores ?? null,
            ai: parsedAiData.ai ?? parsedAiData,
            overall_score:
              parsedAiData.overall_score ??
              parsedAiData.ai?.overall_score ??
              data?.total_score ??
              null,
          };

          console.log('Setting saved evaluation:', mapped);
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
    // Clean up in case the component unmounts while modal is open
    return () => {
      document.body.style.overflow = "";
    };
  }, [showVersions]);

  useEffect(() => {
    if (!design?.id) return;
    setLoadingVersions(true);
    fetchDesignVersions(design.id)
      .then(setVersions)
      .catch((e: string) => console.error("Failed to fetch versions", e))
      .finally(() => setLoadingVersions(false))
  }, [design?.id])

  useEffect(() => {
    if (showVersions) setPage(0);
  }, [showVersions, versions.length])

  useEffect(() => {
    if (!design?.id) return;
    setLoadingVersions(true);
    fetchDesignVersions(design.id)
      .then(setVersions)
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
      // Try to parse the search as a number and jump to that frame
      const num = parseInt(searchQuery.trim(), 10);
      if (!isNaN(num) && num > 0 && num < sortedFrameEvaluations.length) {
        setSelectedFrameIndex(num);
      } else {
        // Fallback: find by text match
        const idx = sortedFrameEvaluations.findIndex(
          (frame, i) =>
            i > 0 &&
            (
              frame.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              frame.ai_data.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              frame.node_id?.toLowerCase().includes(searchQuery.toLowerCase())
            )
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
  }, [isPanning]);

  useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom]);

  useEffect(() => {
    const fetchComments = async () => {
      const supabase = createClient();

      if (!design?.id) {
        console.log(design?.id);
        return;
      }
      const { data, error } = await supabase
        .from("comments")
        .select("id, text, user_id, created_at, local_time, parent_id, updated_at, design_id")
        .eq("design_id", design?.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.log("Supabase error:", error);
        toast.error(`Failed to fetch comments! ${error.message}`);
        return;
      }
      const commentsWithUser = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: userData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", comment.user_id)
            .single();
          return {
            id: comment.id,
            text: comment.text,
            user: {
              id: comment.user_id,
              fullName: userData?.full_name || "",
              avatarUrl: userData?.avatar_url || "",
            },
            replies: [],
            parentId: comment.parent_id,
            createdAt: new Date(comment.created_at),
            updatedAt: comment.updated_at ? new Date(comment.updated_at) : undefined,
            localTime: comment.local_time,
            design_id: comment.design_id,
          };
        })
      );

      const commentMap: { [id: string]: any } = {};
      commentsWithUser.forEach(comment => {
        commentMap[comment.id] = { ...comment, replies: [] };
      });

      const rootComments: any[] = [];
      commentsWithUser.forEach(comment => {
        if (comment.parentId) {
          if (commentMap[comment.parentId]) {
            commentMap[comment.parentId].replies.push(commentMap[comment.id]);
          }
        } else {
          rootComments.push(commentMap[comment.id]);
        }
      });
      setComments(rootComments);
    };

    fetchComments();

    const supabase = createClient();
    const channel = supabase
      .channel('comments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          fetchComments();
          console.log("Payload information", payload)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [design?.id]);


  console.log('evalResult', evalResult);

  if (designLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="w-8 h-8 text-[#ED5E20]" />
        <span className="ml-4 text-lg font-medium text-[#ED5E20]">Loading Design...</span>
      </div>
    );

  if (!design)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Design not found.</p>
      </div>
    );

  return (
    <div>
      <div className="mb-2">
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
        />
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
          <ZoomControls zoom={zoom} setZoom={setZoom} setPan={setPan} pan={pan} />
          {/* Image */}
          <Image
            src={
              selectedFrameIndex === 0
                ? (thumbUrl
                  ? thumbUrl
                  : design.fileKey
                    ? `/api/figma/thumbnail?fileKey=${design.fileKey}${design.nodeId
                      ? `&nodeId=${encodeURIComponent(design.nodeId)}`
                      : ""}`
                    : "/images/design-thumbnail.png")
                : (frameEvaluations[selectedFrameIndex]?.thumbnail_url
                  ? frameEvaluations[selectedFrameIndex].thumbnail_url
                  : "/images/design-thumbnail.png")
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
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: "center center",
              cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default",
            }}
            onMouseDown={handlePanStart}
          />
        </div>
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
        {showEval && sidebarWidth > 20 && <div style={{ width: sidebarWidth }}>
          <div
            className="flex-1 bg-gray-50 border rounded-md dark:bg-[#1A1A1A] p-5 overflow-y-auto flex flex-col h-screen"
            style={{ width: sidebarWidth, minWidth: minSidebarWidth, maxWidth: maxSidebarWidth }}
          >
            {/* Tabs */}
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <button
                className={`text-lg font-semibold flex-1 text-center cursor-pointer
                          ${sidebarTab === "ai" ? "text-[#ED5E20] border-b-2 border-[#ED5E20]" : "text-gray-500"}`}
                onClick={() => setSidebarTab("ai")}
              >
                AI Evaluation
              </button>
              <button
                className={`text-lg font-semibold flex-1 text-center cursor-pointer
                  ${sidebarTab === "comments" ? "text-[#ED5E20] border-b-2 border-[#ED5E20]" : "text-gray-500"}`}
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
                  {/* Loading State */}
                  {loadingEval && (
                    <div className="text-center text-neutral-500">
                      Running evaluation...
                    </div>
                  )}

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

                <div className="mt-auto pt-4">
                  <button
                    onClick={handleEvaluate}
                    disabled={loadingEval}
                    className="w-full px-4 py-2 text-sm rounded-md bg-[#ED5E20] text-white hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingEval ? "Evaluating..." : "Re-Evaluate"}
                  </button>
                </div>
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
                  editingId={editingId}
                  setEditingId={setEditingId}
                  replyingToId={replyingToId}
                  setReplyingToId={setReplyingToId}
                  handleDeleteComment={handleDeleteComment}
                />
              </div>
            )}
          </div>
        </div>
        }
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
          deleteDesignVersion={deleteDesignVersion}
          setVersions={setVersions}
          setVersionChanged={setVersionChanged}
          setEvalResult={setEvalResult}
          setShowEval={setShowEval}
        />
      )}
    </div>
  );
}