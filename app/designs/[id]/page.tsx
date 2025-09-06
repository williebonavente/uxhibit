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
import { Spinner } from "@/components/ui/shadcn-io/spinner/index";
import { fetchDesignVersions } from "@/database/actions/versions/versionHistory";

type Versions = {
  id: string;
  design_id: string;
  version: number;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  ai_summary: string;
  ai_data: string;
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
  snapshot: any;
  // Add other properties as needed
};


type EvaluateInput = {
  designId: string;
  fileKey: string
  nodeId?: string;
  scale?: number;
  fallbackImageUrl?: string;
  snapshot?: any; // Add this line to include snapshot data
}

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
  const router = useRouter();

  const [showEval, setShowEval] = useState(true); // toggle evaluation sidebar
  const [showVersions, setShowVersions] = useState(false); // toggle version history modal
  const [project, setProject] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [designLoading, setDesignLoading] = useState(true);
  const [evalResult, setEvalResult] = useState<EvalResponse | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [versions, setVersions] = useState<Versions[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);


  // const [framesLoading, setFramesLoading] = useState(false); // separate from evaluation
  // const [exportedFrames, setExported] = useState<ExportedFrame[]>([]);
  // const [loading, setLoading] = useState(false);
  // async function refreshSignedThumb(path: string) {
  //   const supabase = createClient();
  //   const { data: signed, error } = await supabase.storage
  //     .from("design-thumbnails")
  //     .createSignedUrl(path, 3600); // 1 hour
  //   if (!error && signed?.signedUrl) setThumbUrl(signed.signedUrl);
  // }

  async function handleEvaluate() {
    if (!design?.id || !design?.fileKey) {
      console.error('Missing required design data:', { id: design?.id, fileKey: design?.fileKey });
      setEvalError("Missing required design data");
      return;
    }

    setLoadingEval(true);
    setEvalError(null);

    try {
      // Get signed URL if thumbnail is a storage path
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
        snapshot: design.snapshot || null,
      });

      console.log('Evaluation successful:', data);
      setEvalResult(data);
    } catch (e: any) {
      console.error('Evaluation failed:', e);
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
          .select(`
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
            snapshot: latestVersion?.snapshot || null
          };
          setDesign(normalized);

          // Set the evaluation result if it exists
          if (latestVersion?.ai_data) {
            const aiData = latestVersion.ai_data;
            console.log('Loading saved AI data:', aiData);

            if (parsedAiData) {
              const evalData: EvalResponse = {
                nodeId: latestVersion.node_id,
                imageUrl: latestVersion.thumbnail_url,
                summary: latestVersion.ai_summary ?? aiData.summary ?? "",
                heuristics: aiData.heuristics ?? null,
                ai_status: "ok",
                overall_score: aiData.overall_score ?? null,
                strengths: Array.isArray(aiData.strengths) ? aiData.strengths : [],
                weaknesses: Array.isArray(aiData.weaknesses) ? aiData.weaknesses : [],
                issues: Array.isArray(aiData.issues) ? aiData.issues : [],
                category_scores: aiData.category_scores ?? null,
                ai: aiData
              }
              console.log('Setting evaluation result:', evalData);
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
          .select(`
            node_id, 
            thumbnail_url, 
            ai_summary, 
            ai_data, 
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

        if (parsedAiData) {
          const mapped: EvalResponse = {
            nodeId: data.node_id,
            imageUrl: data.thumbnail_url,
            summary: data.ai_summary ?? parsedAiData.summary ?? "",
            heuristics: parsedAiData.heuristics ?? null,
            ai_status: "ok",
            overall_score: parsedAiData.overall_score ?? null,
            strengths: Array.isArray(parsedAiData.strengths) ? parsedAiData.strengths : [],
            weaknesses: Array.isArray(parsedAiData.weaknesses) ? parsedAiData.weaknesses : [],
            issues: Array.isArray(parsedAiData.issues) ? parsedAiData.issues : [],
            category_scores: parsedAiData.category_scores ?? null,
            ai: parsedAiData
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
  }, [design?.id]); // Only re-run when design.id changes

  // Design Version scrolling - mess
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
        <div className="w-full h-full border rounded-md bg-accent overflow-y-auto flex items-center justify-center">
          <Image
            src={
              thumbUrl
                ? thumbUrl
                : design.fileKey
                  ? `/api/figma/thumbnail?fileKey=${design.fileKey}${design.nodeId
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
          <div className="w-96 bg-gray-50 border rounded-md dark:bg-[#1A1A1A] p-5 overflow-y-auto flex flex-col h-screen">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-center flex-1">AI Evaluation</h2>
              <button
                onClick={handleEvaluate}
                disabled={loadingEval}
                className="px-4 py-1 text-sm rounded-md bg-[#ED5E20] text-white hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
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
                <div className="text-red-500 text-sm">
                  Error: {evalError}
                </div>
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
                          <li key={i} className="text-neutral-600 dark:text-neutral-300">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {evalResult.weaknesses && evalResult.weaknesses.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Weaknesses</h3>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {evalResult.weaknesses.map((w, i) => (
                          <li key={i} className="text-neutral-600 dark:text-neutral-300">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Category Scores */}
                  {evalResult.category_scores && (
                    <div>
                      <h3 className="font-medium mb-2">Category Scores</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(evalResult.category_scores).map(([category, score]) => (
                          <div key={category} className="flex justify-between text-sm">
                            <span className="capitalize">{category.replace(/_/g, " ")}</span>
                            <span className="font-medium">{Math.round(score)}</span>
                          </div>
                        ))}
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
          <div
            className="absolute inset-0 bg-black/50 transition-opacity backdrop-blur-xl"
            onClick={() => setShowVersions(false)}
          ></div>
          <div className="relative bg-gradient-to-br from-white/95 to-orange-100/20
                        dark:from-[#18181b]/95 dark:to-[#ed5e20]/10 rounded-2xl p-10 w-[1100px] max-h-[85vh]
                        overflow-y-auto shadow-2xl border border-[#ED5E20]/30 backdrop-blur-md transition-all duration-300
                        ring-1 ring-[#ED5E20]/10 flex flex-col"
            style={{
              boxShadow: "0 8px 40px 0 rgba(237,94,32,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.18)",
            }}
          >
            <h2 className="text-lg font-semibold mb-3 relative flex items-center justify-center">
              <span className="mx-auto">Version History</span>
              <button
                onClick={() => setShowVersions(false)}
                aria-label="Minimize"
                className="absolute right-0 ml-2 rounded-full p-2 bg-white/70 dark:bg-[#232323]/80 shadow-lg border border-[#ED5E20]/30
                          backdrop-blur hover:bg-[#ED5E20]/90 hover:text-white transition-all duration-200 text-[#ED5E20]
                          dark:text-[#ED5E20] text-lg flex items-center justify-center scale-110 hover:scale-125 active:scale-95
                          outline-none focus:ring-2 focus:ring-[#ED5E20]/40 cursor-pointer"
                style={{
                  boxShadow: "0 2px 12px 0 rgba(237,94,32,0.15)",
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="2" rx="1" fill="currentColor" />
                </svg>
              </button>
            </h2>
            {loadingVersions ? (
              <div>Loading versions...</div>
            ) : (
              <table className="min-w-full text-sm border">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 border">Version</th>
                    <th className="p-2 border">Score</th>
                    <th className="p-2 border">AI Summary</th>
                    <th className="p-2 border">Evaluated at</th>
                    <th className="p-2 border">Design Overview</th>
                    <th className="p-2 border">File Key</th>
                    <th className="p-2 border">Node ID</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id}>
                      <td className="p-2 border text-center">{v.version}</td>
                      <td className="p-2 border">
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
                      <td className="p-2 border">{v.ai_summary || "-"}</td>
                      <td className="p-2 border">{v.created_at ? new Date(v.created_at).toLocaleString() : "-"}</td>
                      <td className="p-2 border">
                        {v.thumbnail_url && v.thumbnail_url.startsWith("http") ? (
                          <Image src={v.thumbnail_url} alt="thumb"
                            width={70}
                            height={50}

                            className="object-cover" />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 border">{v.file_key}</td>
                      <td className="p-2 border">{v.node_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex justify-end mb-4 mt-5">
              <button
                onClick={() => setShowVersions(false)}
                className=" mt-2 relative px-6 py-2 rounded-full bg-white/70
                dark:bg-[#232323]/80 shadow-xl border-2 border-[#ED5E20]/40 backdrop-blur
                text-[#ED5E20] dark:text-[#ED5E20] font-bold text-lg flex items-center gap-2
                transition-all duration-300 hover:bg-[#ED5E20] hover:text-white hover:scale-110 active:scale-95
                outline-none focus:ring-2 focus:ring-[#ED5E20]/40 overflow-hidden
                group z-10
                cursor-pointer"
                style={{
                  boxShadow: "0 4px 24px 0 rgba(237,94,32,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.10)",
                }}
              >
                <span className="absolute inset-0 rounded-full pointer-events-none z-0
                before:content-[''] before:absolute before:inset-0 before:rounded-full
                before:bg-gradient-to-r before:from-[#ED5E20]/60 before:to-[#ffb37b]/40
                before:blur-lg before:opacity-0 group-hover:opacity-100 before:transition-opacity before:duration-300
                animate-pulse
                " />
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="z-10"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="z-10 tracking-wide drop-shadow">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
