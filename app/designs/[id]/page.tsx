"use client";

import React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
// import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconHistory,
  IconTrash
} from "@tabler/icons-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner/index";
import {
  fetchDesignVersions,
  deleteDesignVersion
} from "@/database/actions/versions/versionHistory";

import { toast } from "sonner";
import {
  IconSortAscending,
  IconSortDescending,
  IconSort09,
  IconSearch
} from "@tabler/icons-react";


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

type Versions = {
  id: string;
  design_id: string;
  version: number;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  ai_summary: string;
  ai_data: string;
  snapshot: Snapshot;
  created_at: string;
};


type Design = {
  id: string;
  project_name: string;
  fileKey?: string;
  nodeId?: string;
  imageUrl: string;
  thumbnail?: string;
  thumbnailPath?: string;
  snapshot: Snapshot;
  current_version_id: string;
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
  // const router = useRouter();

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
  const [page, setPage] = useState(0);

  const pageSize = 6;


  const sortedFrameEvaluations = React.useMemo(() => {
    if (sortOrder === "default") return frameEvaluations;
    // Keep "Overall" frame at index 0, sort the rest
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

          // Handle thumbnail URL
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

  // Auto-evaluate (unchanged) but wait until design loaded
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

        // Get latest evaluation data
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
          .single();

        if (error) {
          console.error('Failed to load evaluation:', error);
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
            nodeId: data.node_id,
            imageUrl: data.thumbnail_url,
            summary: data.ai_summary ?? parsedAiData.summary ?? parsedAiData.ai?.summary ?? "",
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
              data.total_score ??
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

  // useEffect(() => {
  //   setSelectedFrameIndex(0);
  // }, [searchQuery]);

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
      {/* HEADER BAR */}
      <div className="flex pt-5 pb-5 items-center justify-between">
        <div className="flex items-center">
          {/* Back Button */}
          <Link href="/dashboard">
            <IconArrowLeft
              size={24}
              className="cursor-pointer hover:text-orange-600 mr-2"
            />
          </Link>
          <h1 className="text-xl font-medium">
            {design.project_name}
            {/* Only show version if NOT current */}
            {selectedVersion && selectedVersion.id !== design.current_version_id
              ? ` (v${selectedVersion.version})`
              : ""}
          </h1>
        </div>
        <div className="flex gap-3 items-center">


          {/* Version History */}
          <div className="flex gap-3 items-center">
            <div className="relative group">
              <button
                onClick={handleShowVersions}
                className="cursor-pointer p-2 rounded hover:bg-[#ED5E20]/15 hover:text-[#ED5E20] transition"
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
          </div>

          {/* Sorter and serach experimental */}
          {/* SEARCH */}
          <div className="flex gap-2 items-center">

            <div className="relative group">
              <button
                className="cursor-pointer p-2 rounded hover:bg-[#ED5E20]/15 hover:text-[#ED5E20] transition"
                aria-label="Search"
                title="Search"
                onClick={() => setShowSearch((prev) => !prev)}
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
                <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 z-30 bg-white dark:bg-[#232323] border rounded shadow-lg p-3 w-64">
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded border focus:outline-none"
                    placeholder="Search frames..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="mt-2 w-full bg-[#ED5E20] text-white rounded py-1"
                    onClick={() => setShowSearch(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* SORT  */}
            <div className="relative group">
              <button
                onClick={() => setSortOrder("asc")}
                className={`cursor-pointer p-2 rounded transition
                 ${sortOrder === "asc"
                    ? "bg-[#ED5E20]/15 text-[#ED5E20]"
                    : "bg-gray-200 text-gray-700 hover:bg-[#ED5E20]/15 hover:text-[#ED5E20]"}`}
                aria-label="Sort by Lowest Score"
                title="Sort by Lowest Score"
              >
                <IconSortAscending size={20} />
              </button>
              {/* Tooltip */}
              <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
                  Lowest Score
                </div>
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={() => setSortOrder("desc")}
                className={`cursor-pointer p-2 rounded transition
                ${sortOrder === "desc"
                    ? "bg-[#ED5E20]/15 text-[#ED5E20]"
                    : "bg-gray-200 text-gray-700 hover:bg-[#ED5E20]/15 hover:text-[#ED5E20]"}`}
                aria-label="Sort by Highest Score"
                title="Sort by Highest Score"
              >
                <IconSortDescending size={20} />
              </button>
              {/* Tooltip */}
              <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
                  Highest Score
                </div>
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={() => setSortOrder("default")}
                className={`cursor-pointer p-2 rounded transition
                ${sortOrder === "default"
                    ? "bg-[#ED5E20]/15 text-[#ED5E20]"
                    : "bg-gray-200 text-gray-700 hover:bg-[#ED5E20]/15 hover:text-[#ED5E20]"}`}
                aria-label="Default Order"
                title="Default Order"
              >
                <IconSort09 size={20} />
              </button>
              {/* Tooltip */}
              <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
                  Default Order
                </div>
              </div>
            </div>
          </div>

          {design?.is_active ? (
            <button
              onClick={async () => {
                await unpublishProject();
                await syncPublishedState();
              }}
              className="flex items-center gap-2 bg-gray-300 text-gray-700 
                      px-8 py-2 rounded-xl font-semibold shadow-md hover:bg-gray-400 
                      transition-all duration-200 text-sm focus:outline-none 
                      focus:ring-2 focus:ring-[#ED5E20]/40 cursor-pointer
                      "
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill="#6B7280" fillOpacity="0.18" />
                <path d="M6 6l8 8M14 6l-8 8" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Unpublish
            </button>
          ) : (
            <button
              onClick={async () => {
                await publishProject();
                await syncPublishedState();
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-[#ED5E20] 
            to-orange-400 text-white px-8 py-2 rounded-xl font-semibold shadow-md 
            hover:from-orange-500 hover:to-[#ED5E20] transition-all duration-200 
            text-sm focus:outline-none focus:ring-2 focus:ring-[#ED5E20]/40 animate-pulse cursor-pointer"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill="#fff" fillOpacity="0.18" />
                <path d="M6 10.5l2.5 2.5L14 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Publish
            </button>
          )}
        </div>
      </div>

      <div className="flex h-screen">
        {/* TODO:  */}
        {/* Center Design Area */}
        <div className="flex-2 h-full border rounded-md bg-accent overflow-y-auto flex items-center justify-center">
          <Image
            src={
              selectedFrameIndex === 0
                ? (thumbUrl // Use signed Supabase URL for "Overall"
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
          />
        </div>
        {/* Toggle Evaluation Button */}
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

        {/* RIGHT PANEL (Evaluation Sidebar) */}
        {showEval && (
          <div className="flex-1 bg-gray-50 border rounded-md dark:bg-[#1A1A1A] p-5 overflow-y-auto flex flex-col h-screen">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-center flex-1">AI Evaluation</h2>
            </div>

            {sortedFrameEvaluations.length > 0 && (
              <div className="flex items-center gap-4 mb-4 justify-center">
                <button
                  className="px-2 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                  onClick={() => setSelectedFrameIndex((prev) => Math.max(0, prev - 1))}
                  disabled={selectedFrameIndex === 0}
                  aria-label="Previous Frame"
                >
                  &#8592;
                </button>
                <span className="text-sm font-medium">
                  {selectedFrameIndex === 0
                    ? "Overall"
                    : sortedFrameEvaluations[selectedFrameIndex]?.ai_summary ||
                    sortedFrameEvaluations[selectedFrameIndex]?.node_id ||
                    `Frame ${selectedFrameIndex}`}
                  {" "}
                  <span className="text-gray-400">
                    ({selectedFrameIndex + 1} / {sortedFrameEvaluations.length})
                  </span>
                </span>
                <button
                  className="px-2 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                  onClick={() =>
                    setSelectedFrameIndex((prev) =>
                      Math.min(filteredFrameEvaluations.length - 1, prev + 1)
                    )
                  }
                  disabled={selectedFrameIndex === filteredFrameEvaluations.length - 1}
                  aria-label="Next Frame"
                >
                  &#8594;
                </button>
              </div>
            )}
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
                <>
                  {/* Score */}
                  {evalResult && typeof evalResult.overall_score === "number" && (
                    <div className="p-3 rounded-lg bg-[#ED5E20]/10 justify-center items-center">
                      <h3 className="font-medium mb-2 text-center">Overall Score</h3>
                      <div className="text-2xl font-bold text-[#ED5E20] text-center">
                        {Math.round(evalResult.overall_score)}/100
                      </div>
                    </div>
                  )}
                  {/* Summary */}
                  <div className="p-3 rounded-lg bg-[#FFFF00]/10">
                    <h3 className="font-medium mb-2">Summary</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {evalResult.summary}
                    </p>
                  </div>
                  {/* Strengths */}
                  {evalResult.strengths && evalResult.strengths.length > 0 && (
                    <div className="p-3 rounded-lg bg-[#008000]/10">
                      <h3 className="font-medium mb-2">Strengths</h3>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {evalResult.strengths.map((s, i) => (
                          <li key={i} className="text-neutral-600 dark:text-neutral-300">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Issues */}
                  {currentFrame?.ai_data.issues?.length > 0 && (
                    <div className="p-3 rounded-lg bg-[#FFB300]/10 mb-4">
                      <h3 className="font-medium mb-2">Issues</h3>
                      <ul className="space-y-3">

                        {(evalResult.issues ?? [])
                          .sort((a, b) => {
                            const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
                            const aKey = (a.severity?.toLowerCase() as string) || "low";
                            const bKey = (b.severity?.toLowerCase() as string) || "low";
                            return (order[aKey] ?? 3) - (order[bKey] ?? 3);
                          })
                          .map((issue, i) => {
                            let badgeColor = "bg-gray-300 text-gray-800";
                            if (issue.severity?.toLowerCase() === "high") badgeColor = "bg-red-500 text-white";
                            else if (issue.severity?.toLowerCase() === "medium") badgeColor = "bg-yellow-400 text-yellow-900";
                            else if (issue.severity?.toLowerCase() === "low") badgeColor = "bg-blue-200 text-blue-900";

                            return (
                              <li
                                key={issue.id || i}
                                className="flex items-start gap-3 bg-white/70 dark:bg-[#232323]/70 rounded-lg p-3 border border-[#ED5E20]/20 shadow-sm"
                              >
                                <span
                                  className={`min-w-[60px] text-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeColor}`}
                                  style={{ letterSpacing: "0.05em" }}
                                >
                                  {issue.severity}
                                </span>
                                <span className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">
                                  {issue.message}
                                </span>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  )}
                  {/* Suggestions Section */}
                  {currentFrame?.ai_data.issues?.some(issue => issue.suggestion) && (
                    <div className="p-3 rounded-lg bg-[#ED5E20]/10 mb-4">
                      <h3 className="font-medium mb-2">Suggestions</h3>
                      <ul className="list-disc list-inside text-sm space-y-2">
                        {(evalResult.issues ?? [])
                          .filter(issue => issue.suggestion)
                          .map((issue, i) => (
                            <li key={issue.id || i} className="text-neutral-700 dark:text-neutral-200">
                              {issue.suggestion}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {/* Weaknesses */}
                  {currentFrame?.ai_data.weaknesses?.length > 0 && (
                    <div className="p-3 rounded-lg bg-[#FF0000]/10">
                      <h3 className="font-medium mb-2">Weaknesses</h3>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {(evalResult.weaknesses ?? []).map((w, i) => (
                          <li key={i} className="text-neutral-600 dark:text-neutral-300">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Category Scores */}
                  {currentFrame?.ai_data.category_scores && (
                    <div className="p-3 rounded-lg bg-[#ED5E20]/10">
                      <h3 className="font-medium mb-2">Category Scores</h3>
                      <ul className="space-y-2 list-disc list-inside">
                        {Object.entries(evalResult.category_scores ?? {}).map(([category, score]) => {
                          // Coloring logic
                          let bg =
                            "bg-gray-100 dark:bg-gray-800 text-neutral-600 dark:text-neutral-300";
                          if (score >= 75) {
                            bg =
                              "bg-[#008000]/20 dark:bg-[#008000]/10 text-neutral-600 dark:text-neutral-300";
                          } else if (score < 50) {
                            bg =
                              "bg-[#FF0000]/20 dark:bg-[#FF0000]/10 text-neutral-600 dark:text-neutral-300";
                          } else {
                            bg =
                              "bg-[#FFFF00]/20 dark:bg-[#FFFF00]/10 text-neutral-600 dark:text-neutral-300";
                          }
                          return (
                            <li
                              key={category}
                              className={`rounded-md px-3 py-2 flex justify-between items-center font-medium ${bg}`}
                            >
                              <span className="capitalize">
                                {category.replace(/_/g, " ")}
                              </span>
                              <span>{Math.round(score)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
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
          </div>
        )}
      </div>
      {/* VERSION HISTORY MODAL */}
      {showVersions && (
        <div className="fixed inset-0 flex items-center justify-center pl-20 pr-20 cursor-pointer">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity backdrop-blur-md"
            onClick={() =>
              setShowVersions(false)}
          >
          </div>
          <div className="bg-gray-50 border dark:bg-[#1A1A1A] relative rounded-xl p-10 w-[1100px] max-h-[85vh]
                        overflow-y-auto w-full"
          >
            <h2 className="text-lg font-semibold mb-3 relative flex items-center justify-center">
              <span className="mx-auto">Version History</span>
              <button
                onClick={() => setShowVersions(false)}
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

              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#ED5E20] dark:bg-[#ED5E20] text-white dark:text-white">
                      <th className="p-2 border">Version</th>
                      <th className="p-2 border">Score</th>
                      <th className="p-2 border">AI Summary</th>
                      <th className="p-2 border">Parameter</th>
                      <th className="p-2 border">Thumbnail</th>
                      <th className="p-2 border">Node ID</th>
                      <th className="p-2 border">Evaluated at</th>
                      <th className="p-2 border text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions
                      .slice(page * pageSize, (page + 1) * pageSize)
                      .map((v) => {
                        const isCurrent = String(v.id).trim() === String(design?.current_version_id).trim();
                        const isSelected = selectedVersion?.id === v.id;
                        return (
                          <tr
                            key={v.id}
                            className={
                              "cursor-pointer transition " +
                              (isCurrent
                                ? "hover:bg-[#ED5E20]/10 dark:hover:bg-[#ED5E20]/10"
                                : isSelected
                                  ? "bg-[#ED5E20]/20 dark:bg-[#ED5E20]/20"
                                  : "hover:bg-[#ED5E20]/10 dark:hover:bg-[#ED5E20]/10")
                            }
                            onClick={async () => {
                              setSelectedVersion(v);
                              try {
                                const supabase = createClient();
                                const { data: latest, error } = await supabase
                                  .from("design_versions")
                                  .select(`node_id, thumbnail_url, ai_summary, ai_data, 
                                    snapshot,  created_at`)
                                  .eq("id", v.id)
                                  .single();
                                if (error) {
                                  toast.error("Failed to fetch latest version data.");
                                  return;
                                }
                                let parsedAiData = null;
                                try {
                                  parsedAiData = typeof latest.ai_data === "string" ? JSON.parse(latest.ai_data) : latest.ai_data;
                                } catch { }

                                if (parsedAiData) {
                                  setEvalResult({
                                    nodeId: latest.node_id,
                                    imageUrl: latest.thumbnail_url,
                                    summary: latest.ai_summary ?? parsedAiData.summary ?? "",
                                    heuristics: parsedAiData.heuristics ?? null,
                                    ai_status: "ok",
                                    overall_score: parsedAiData.overall_score ?? null,
                                    strengths: Array.isArray(parsedAiData.strengths) ? parsedAiData.strengths : [],
                                    weaknesses: Array.isArray(parsedAiData.weaknesses) ? parsedAiData.weaknesses : [],
                                    issues: Array.isArray(parsedAiData.issues) ? parsedAiData.issues : [],
                                    category_scores: parsedAiData.category_scores ?? null,
                                    ai: parsedAiData,
                                  });
                                  setShowEval(true);
                                }
                                setShowVersions(false);
                              } catch (error) {
                                toast.error(`Error loading version data. ${error}`);
                              }
                            }}
                          >
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
                                    <circle cx="10" cy="10" r="10" fill="#fff" fillOpacity="0.18" />
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
                              {(() => {
                                if (!v.ai_data) return "-";
                                try {
                                  const ai = typeof v.ai_data === "string" ? JSON.parse(v.ai_data) : v.ai_data;
                                  return ai.overall_score !== undefined ? Math.round(ai.overall_score) : "-";
                                } catch {
                                  return "-";
                                }
                              })()}
                            </td>

                            {/*AI SUMMARY*/}
                            <td className="p-2 border text-gray-700 dark:text-gray-200">{v.ai_summary || "-"}</td>

                            {/*PARAMETERS*/}
                            <td className="p-5 border align-middle text-gray-700 dark:text-gray-200">
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
                            </td>

                            {/*THUMBNAIL*/}
                            <td className="p-2 border text-gray-700 dark:text-gray-200">
                              {v.thumbnail_url && v.thumbnail_url.startsWith("http") ? (
                                <Image src={v.thumbnail_url} alt="thumb"
                                  width={70}
                                  height={50}
                                  className="object-cover" />
                              ) : (
                                "-"
                              )}
                            </td>

                            {/*NODE ID*/}
                            <td className="p-2 border text-gray-700 dark:text-gray-200 text-center">{v.node_id}</td>

                            {/*EVALUATION TIME*/}
                            <td className="p-2 border text-gray-700 dark:text-gray-200 text-center">{v.created_at ? new Date(v.created_at).toLocaleString() : "-"}</td>

                            {/*DELETE*/}
                            <td className="p-2 border text-center text-gray-700 dark:text-gray-200">
                              {!isCurrent && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    toast(() => {
                                      const toastId = `delete-version-${v.id}`;
                                      return (
                                        <div className="flex flex-col items-center justify-center gap-2 p-4 ml-8">
                                          <span className="text-base font-semibold text-[#ED5E20] text-center">
                                            Delete version <span className="font-bold">v{v.version}</span>?
                                          </span>
                                          <span className="mt-1 text-xs text-gray-500 text-center">
                                            This action cannot be undone.
                                          </span>
                                          <div className="flex gap-6 mt-4 justify-center w-full">
                                            <button
                                              onClick={async () => {
                                                toast.dismiss(toastId);
                                                try {
                                                  await deleteDesignVersion(v.id);
                                                  setVersions(versions.filter(ver => ver.id !== v.id));
                                                  setVersionChanged((v) => v + 1);
                                                  toast.success(
                                                    <span>
                                                      <span className="font-bold text-[#ED5E20]">v{v.version}</span> deleted successfully!
                                                    </span>
                                                  );
                                                } catch (err: unknown) {
                                                  const errorMsg =
                                                    err instanceof Error
                                                      ? err.message
                                                      : typeof err === "string"
                                                        ? err
                                                        : JSON.stringify(err);

                                                  // Check for foreign key violation (published version)
                                                  let isPublishedConstraint = false;
                                                  try {
                                                    const parsed = typeof err === "string" ? JSON.parse(err) : err;
                                                    if (parsed && parsed.code === "23503") {
                                                      isPublishedConstraint = true;
                                                    }
                                                  } catch { }

                                                  toast.error(
                                                    <span>
                                                      <span className="font-bold text-[#ED5E20]">v{v.version}</span> could not be deleted.<br />
                                                      {isPublishedConstraint ? (
                                                        <span>
                                                          This version is currently published.<br />
                                                          Please unpublish the design before deleting this version.
                                                        </span>
                                                      ) : (
                                                        <>
                                                          {errorMsg && (
                                                            <span className="text-xs text-red-400">{errorMsg}<br /></span>
                                                          )}
                                                          Please try again.
                                                        </>
                                                      )}
                                                    </span>
                                                  );
                                                }
                                              }}
                                              className="px-6 py-2 rounded-full bg-gradient-to-r from-[#ED5E20] to-orange-400 text-white font-bold shadow-lg hover:scale-105 hover:from-orange-500 hover:to-[#ED5E20] transition-all duration-200 cursor-pointer"
                                            >
                                              Yes, Delete
                                            </button>
                                            <button
                                              onClick={() => toast.dismiss(toastId)}
                                              className="px-6 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold shadow hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-200 cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }, { duration: 10000, id: `delete-version-${v.id}` });
                                  }}
                                  className="text-red-500 hover:text-white hover:bg-red-500 rounded-full p-1 cursor-pointer transition-all duration-200"
                                  title="Delete version"
                                >
                                  <IconTrash size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
            {versions.length > pageSize && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 px-2">
                {/* Progress Bar */}
                <div className="w-full sm:w-1/2 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-[#ED5E20] to-orange-400 transition-all duration-500"
                    style={{
                      width: `${((page + 1) / Math.ceil(versions.length / pageSize)) * 100}%`,
                    }}
                  />
                </div>
                {/* Pagination Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
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
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="mr-1">
                      <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back
                    <span className="absolute -inset-1 rounded-full pointer-events-none group-hover:animate-pulse" />
                  </button>
                  <span className="mx-2 text-sm font-semibold tracking-wide bg-gradient-to-r from-[#ED5E20]/80 to-orange-400/80 text-white px-4 py-1 rounded-full shadow">
                    Page {page + 1} of {Math.ceil(versions.length / pageSize)}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(Math.ceil(versions.length / pageSize) - 1, p + 1))}
                    disabled={(page + 1) * pageSize >= versions.length}
                    className={`
                      group relative flex items-center justify-center px-4 py-2 rounded-full
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
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="ml-1">
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="absolute -inset-1 rounded-full pointer-events-none group-hover:animate-pulse" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}