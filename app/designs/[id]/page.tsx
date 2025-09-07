"use client";

import React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
// import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconUpload,
  IconHistory,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";

type Design = {
  id: string;
  project_name: string;
  fileKey?: string;
  nodeId?: string;
  imageUrl: string;
  thumbnail?: string;
  thumbnailPath?: string;
  snapshot: any;
  // Add other properties as needed
};

type EvaluateInput = {
  designId: string;
  fileKey: string;
  nodeId?: string;
  scale?: number;
  fallbackImageUrl?: string;
  snapshot?: any; // Add this line to include snapshot data
};

type ExportedFrame = {
  nodeId: string;
  remoteUrl: string;
};

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
      suggestion: string;
    }[];
    category_scores?: Record<string, number>;
  } | null;
};

export async function evaluateDesign(
  input: EvaluateInput
): Promise<EvalResponse> {
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
  return data as EvalResponse;
}

export default function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();

  const [showEval, setShowEval] = useState(true); // toggle evaluation sidebar
  const [showVersions, setShowVersions] = useState(false); // toggle version history modal
  const [project, setProject] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [design, setDesign] = useState<Design | null>(null);
  // const [loading, setLoading] = useState(false);
  const [designLoading, setDesignLoading] = useState(true);
  // const [framesLoading, setFramesLoading] = useState(false); // separate from evaluation
  // const [exportedFrames, setExported] = useState<ExportedFrame[]>([]);
  const [evalResult, setEvalResult] = useState<EvalResponse | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  // async function refreshSignedThumb(path: string) {
  //   const supabase = createClient();
  //   const { data: signed, error } = await supabase.storage
  //     .from("design-thumbnails")
  //     .createSignedUrl(path, 3600); // 1 hour
  //   if (!error && signed?.signedUrl) setThumbUrl(signed.signedUrl);
  // }

  async function handleEvaluate() {
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
      // Get signed URL if thumbnail is a storage path
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
        designId: design.id, // Make sure this exists
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
        snapshot: design.snapshot || null,
      });

      console.log("Evaluation successful:", data);
      setEvalResult(data);
    } catch (e: any) {
      console.error("Evaluation failed:", e);
      setEvalError(e.message || "Failed to evaluate");
    } finally {
      setLoadingEval(false);
    }
  }

  // async function exportFrames() {
  //   if (!design?.fileKey) return;
  //   setFramesLoading(true);
  //   try {
  //     const res = await fetch("/api/figma/export", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         fileKey: design?.fileKey,
  //         mode: "frames",
  //         scale: 2,
  //         format: "png",
  //         upload: false,
  //       }),
  //     });

  //     if (!res.ok) {
  //       throw new Error(`Export failed (${res.status})`);
  //     }
  //     const data: { nodes: ExportedFrame[] } = await res.json();
  //     setExported(data.nodes ?? []);
  //   } catch (err: any) {
  //     console.error(err);
  //   } finally {
  //     setFramesLoading(false);
  //   }
  // }

  // Save updated project back to localStorage
  const saveProject = (updated: any) => {
    const stored = JSON.parse(localStorage.getItem("designs") || "[]");
    const newData = stored.map((d: any) => (d.id === id ? updated : d));
    localStorage.setItem("designs", JSON.stringify(newData));
    setProject(updated);

    // Always select the latest version
    if (updated.versions?.length > 0) {
      setSelectedVersion(updated.versions[updated.versions.length - 1]);
    } else {
      setSelectedVersion(null);
    }
  };

  // Handle file reupload → create new version
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    const reader = new FileReader();
    reader.onload = () => {
      const currentVersions = project.versions || [];
      const newVersionNumber = currentVersions.length + 1; // auto increment

      const newVersion = {
        version: newVersionNumber,
        timestamp: new Date().toLocaleString(),
        fileName: file.name,
        fileData: reader.result, // base64 for preview
        evaluation: `Evaluation for version ${newVersionNumber}`, // placeholder text
      };

      const updatedProject = {
        ...project,
        versions: [...currentVersions, newVersion],
      };

      // Save and set as current project + select this version
      saveProject(updatedProject);
    };
    reader.readAsDataURL(file);
    router.push("/evaluate");
  };

  // Publish project (latest version)
  const publishProject = () => {
    if (!project) return;
    const updated = {
      ...project,
      published: true,
      publishedVersion: project.versions?.[project.versions.length - 1] || null,
    };
    saveProject(updated);
    alert(`Project "${project.project_name}" published!`);
  };

  useEffect(() => {
    async function loadDesign() {
      setDesignLoading(true);
      try {
        const supabase = createClient();
        // Modify the query to include AI evaluation data
        const { data, error } = await supabase
          .from("designs")
          .select(
            `
            id,
            title,
            figma_link,
            file_key,
            node_id,
            thumbnail_url,
            current_version_id,
            design_versions!design_versions_design_id_fkey (
              id,
              file_key,
              node_id,
              thumbnail_url,
              ai_summary,
              ai_data,
              snapshot,
              created_at,
              version
            )
          `
          )
          .eq("id", id)
          .order("created_at", {
            foreignTable: "design_versions",
            ascending: false,
          })
          .limit(1, { foreignTable: "design_versions" })
          .single();

        if (!error && data) {
          const latestVersion = data.design_versions?.[0];
          // Parse the JSONB data
          let parsedAiData = null;
          if (latestVersion?.ai_data) {
            try {
              // Handle both string and object formats
              parsedAiData =
                typeof latestVersion.ai_data === "string"
                  ? JSON.parse(latestVersion.ai_data)
                  : latestVersion.ai_data;

              console.log("Parsed AI data:", parsedAiData);
            } catch (e) {
              console.error("Error parsing AI data:", e);
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
          };
          setDesign(normalized);

          // Set the evaluation result if it exists
          if (latestVersion?.ai_data) {
            const aiData = latestVersion.ai_data;
            console.log("Loading saved AI data:", aiData);

            if (parsedAiData) {
              const evalData: EvalResponse = {
                nodeId: latestVersion.node_id,
                imageUrl: latestVersion.thumbnail_url,
                summary: latestVersion.ai_summary ?? aiData.summary ?? "",
                heuristics: aiData.heuristics ?? null,
                ai_status: "ok",
                overall_score: aiData.overall_score ?? null,
                strengths: Array.isArray(aiData.strengths)
                  ? aiData.strengths
                  : [],
                weaknesses: Array.isArray(aiData.weaknesses)
                  ? aiData.weaknesses
                  : [],
                issues: Array.isArray(aiData.issues) ? aiData.issues : [],
                category_scores: aiData.category_scores ?? null,
                ai: aiData,
              };
              console.log("Setting evaluation result:", evalData);
              setEvalResult(evalData);
            }
            setShowEval(true); // Show evaluation panel automatically
          }

          // Handle thumbnail URL
          if (data.thumbnail_url && !data.thumbnail_url.startsWith("http")) {
            const { data: signed } = await supabase.storage
              .from("design-thumbnails")
              .createSignedUrl(data.thumbnail_url, 3600);
            if (signed?.signedUrl) setThumbUrl(signed.signedUrl);
          }
        } else {
          console.error("Failed to load design:", error);
          setDesign(null);
        }
      } catch (err) {
        console.error("Error loading design:", err);
        setDesign(null);
      } finally {
        setDesignLoading(false);
      }
    }

    loadDesign();
  }, [id]);

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

  // Auto-refresh signed Url every 50 min (before expiry)

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

  // Fetch project data from localStorage by id
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("designs") || "[]");
    const found = stored.find((d: any) => d.id === id);
    if (found) {
      setProject(found);
      if (found.versions?.length > 0) {
        setSelectedVersion(found.versions[found.versions.length - 1]); // latest version
      } else {
        setSelectedVersion(null);
      }
    }
  }, [id]);

  useEffect(() => {
    const supabase = createClient();
    async function loadSavedEvaluation() {
      try {
        if (!design?.id) return;

        // Get latest evaluation data
        const { data, error } = await supabase
          .from("design_versions")
          .select(
            `
            node_id, 
            thumbnail_url, 
            ai_summary, 
            ai_data, 
            snapshot, 
            created_at
          `
          )
          .eq("design_id", design.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error("Failed to load evaluation:", error);
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

        if (parsedAiData) {
          const mapped: EvalResponse = {
            nodeId: data.node_id,
            imageUrl: data.thumbnail_url,
            summary: data.ai_summary ?? parsedAiData.summary ?? "",
            heuristics: parsedAiData.heuristics ?? null,
            ai_status: "ok",
            overall_score: parsedAiData.overall_score ?? null,
            strengths: Array.isArray(parsedAiData.strengths)
              ? parsedAiData.strengths
              : [],
            weaknesses: Array.isArray(parsedAiData.weaknesses)
              ? parsedAiData.weaknesses
              : [],
            issues: Array.isArray(parsedAiData.issues)
              ? parsedAiData.issues
              : [],
            category_scores: parsedAiData.category_scores ?? null,
            ai: parsedAiData,
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
  }, [design?.id]); // Only re-run when design.id changes

  if (designLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading Design...</p>
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
            {selectedVersion ? `(v${selectedVersion.version})` : ""}
          </h1>
        </div>

        <div className="flex gap-3 items-center">
          {/* Upload New Version */}
          <Input
            type="file"
            accept=".fig"
            id="fileUpload"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="fileUpload"
            className="cursor-pointer p-2 rounded hover:bg-[#ED5E20]/15"
          >
            <IconUpload size={22} />
          </label>

          {/* Version History */}
          <button
            onClick={() => setShowVersions(true)}
            className="cursor-pointer p-2 rounded hover:bg-[#ED5E20]/15"
          >
            <IconHistory size={22} />
          </button>

          {/* Publish Button */}
          <button
            onClick={publishProject}
            className="bg-[#ED5E20] text-white px-8 py-2 rounded-md hover:bg-orange-600 hover:cursor-pointer text-sm"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="flex h-screen">
        {/* LEFT PANEL */}
        {/* Design Area */}
        <div className="flex-2 h-full border rounded-md bg-accent overflow-y-auto flex items-center justify-center">
          <Image
            src={
              thumbUrl
                ? thumbUrl
                : design.fileKey
                ? `/api/figma/thumbnail?fileKey=${design.fileKey}${
                    design.nodeId
                      ? `&nodeId=${encodeURIComponent(design.nodeId)}`
                      : ""
                  }`
                : "/images/design-thumbnail.png"
            }
            alt={design.project_name || "Design"}
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
              <h2 className="text-lg font-semibold text-center flex-1">
                AI Evaluation
              </h2>
              <button
                onClick={handleEvaluate}
                disabled={loadingEval}
                className="bg-[#ED5E20] text-white px-8 py-2 rounded-md hover:bg-orange-600 hover:cursor-pointer text-sm"
              >
                {loadingEval ? "Evaluating..." : "Re-Evaluate"}
              </button>
            </div>

            <div className="space-y-4">
              {/* Loading State */}
              {loadingEval && (
                <div className="text-center text-neutral-500">
                  Running evaluation...
                </div>
              )}

              {/* Error State */}
              {evalError && (
                <div className="text-red-500 text-sm">Error: {evalError}</div>
              )}

              {/* Results */}
              {evalResult && !loadingEval && (
                <>
                  {/* Summary */}
                  <div>
                    <h3 className="font-medium mb-2">Summary</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {evalResult.summary}
                    </p>
                  </div>

                  {/* Score */}
                  {evalResult.overall_score && (
                    <div>
                      <h3 className="font-medium mb-2">Overall Score</h3>
                      <div className="text-2xl font-bold text-[#ED5E20]">
                        {Math.round(evalResult.overall_score)}/100
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {evalResult.strengths && evalResult.strengths.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Strengths</h3>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {evalResult.strengths.map((s, i) => (
                          <li
                            key={i}
                            className="text-neutral-600 dark:text-neutral-300"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {evalResult.weaknesses &&
                    evalResult.weaknesses.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Weaknesses</h3>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {evalResult.weaknesses.map((w, i) => (
                            <li
                              key={i}
                              className="text-neutral-600 dark:text-neutral-300"
                            >
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Category Scores */}
                  {evalResult.category_scores && (
                    <div>
                      <h3 className="font-medium mb-2">Category Scores</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(evalResult.category_scores).map(
                          ([category, score]) => (
                            <div
                              key={category}
                              className="flex justify-between text-sm"
                            >
                              <span className="capitalize">
                                {category.replace(/_/g, " ")}
                              </span>
                              <span className="font-medium">
                                {Math.round(score)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* VERSION HISTORY MODAL */}
      {showVersions && (
        <div className="fixed inset-0 flex items-center justify-center">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowVersions(false)} // click outside to close
          ></div>

          {/* Modal content */}
          <div className="relative bg-white dark:bg-accent rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl">
            <h2 className="text-lg font-semibold mb-3">Version History</h2>
            <ul className="space-y-2">
              {project?.versions?.map((v: any) => (
                <li
                  key={v.version}
                  onClick={() => {
                    setSelectedVersion(v);
                    setShowVersions(false);
                  }}
                  className={`p-2 border rounded-md cursor-pointer ${
                    selectedVersion?.version === v.version
                      ? "bg-orange-200 dark:bg-orange-700"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  v{v.version} - {v.timestamp} ({v.fileName})
                </li>
              ))}
            </ul>
            <div className="mt-4 text-right">
              <button
                onClick={() => setShowVersions(false)}
                className="px-3 py-1 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
