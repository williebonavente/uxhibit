"use client";

import React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import {
  IconArrowLeft,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconUpload,
  IconHistory,
} from "@tabler/icons-react";

type Design = {
  id: string;
  project_name: string;
  fileKey?: string;
  nodeId?: string;
  imageUrl: string;
  thumbnail?: string;
  thumbnailPath?: string;
  // Add other properties as needed
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

export async function evaluateDesign(input: {
  fileKey: string;
  nodeId?: string;
  scale?: number;
  fallbackImageUrl?: string;
}): Promise<EvalResponse> {
  const res = await fetch("/api/ai/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to evaluate");
  return data as EvalResponse;
}

export default function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [showEval, setShowEval] = useState(true); // toggle evaluation sidebar
  const [showVersions, setShowVersions] = useState(false); // toggle version history modal
  const [project, setProject] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [design, setDesign] = useState<Design | null>(null);
  // const [loading, setLoading] = useState(false);
  const [designLoading, setDesignLoading] = useState(true);
  const [framesLoading, setFramesLoading] = useState(false); // separate from evaluation
  const [exportedFrames, setExported] = useState<ExportedFrame[]>([]);
  const [evalResult, setEvalResult] = useState<EvalResponse | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  async function refreshSignedThumb(path: string) {
    const supabase = createClient();
    const { data: signed, error } = await supabase.storage
      .from("design-thumbnails")
      .createSignedUrl(path, 3600); // 1 hour
    if (!error && signed?.signedUrl) setThumbUrl(signed.signedUrl);
  }

  async function handleEvaluate() {
    if (!design?.fileKey) return;
    setLoadingEval(true);
    setEvalError(null);
    try {
      const data = await evaluateDesign({
        fileKey: design.fileKey,
        nodeId: design.nodeId,
        scale: 3,
        fallbackImageUrl: design.thumbnail || undefined,
      });
      setEvalResult(data);
    } catch (e: any) {
      setEvalError(e.message || "Failed to evaluate");
    } finally {
      setLoadingEval(false);
    }
  }

  async function exportFrames() {
    if (!design?.fileKey) return;
    setFramesLoading(true);
    try {
      const res = await fetch("/api/figma/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey: design?.fileKey,
          mode: "frames",
          scale: 2,
          format: "png",
          upload: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }
      const data: { nodes: ExportedFrame[] } = await res.json();
      setExported(data.nodes ?? []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setFramesLoading(false);
    }
  }

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
      // 2. Fetch from DB (via Supabase)
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("designs")
          .select("id,title,figma_link,file_key,node_id,thumbnail_url")
          .eq("id", id)
          .single();

        if (!error && data) {
          const normalized: Design = {
            id: data.id,
            project_name: data.title,
            fileKey: data.file_key || undefined,
            nodeId: data.node_id || undefined,
            imageUrl: data.thumbnail_url || "/images/design-thumbnail.png",
            thumbnail: data.thumbnail_url || undefined,
          };
          setDesign(normalized);

          // Only refresh signed URL on client
          if (data.thumbnail_url && !data.thumbnail_url.startsWith("http")) {
            // treat as storage path
            const { data: signed } = await supabase.storage
              .from("design-thumbnails")
              .createSignedUrl(data.thumbnail_url, 3600);
            if (signed?.signedUrl) setThumbUrl(signed.signedUrl);
            // refreshSignedThumb(data.thumbnail_url);
          }
        } else {
          setDesign(null);
        }
      } catch {
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

  if (designLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading Design</p>
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
          <Link href="/">
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
          <input
            type="file"
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
          <div className="w-96 bg-gray-50 border rounded-md dark:bg-[#1A1A1A] p-5 overflow-y-auto flex flex-col h-screen">
            <div>
              <h2 className="text-lg font-semibold mb-3 text-center">
                AI Evaluation
              </h2>
            </div>
            <div className="flex items-center justify-center border rounded-md p-3 h-full w-full">
              {/* Placeholder for AI evaluation content */}
              <div className="prose m-0 dark:prose-invert text-center">
                <Button
                  onClick={handleEvaluate}
                  disabled={!design.fileKey || loadingEval}
                  className="px-3 py-2 rounded-md disabled:opacity-50 mb-5 cursor-pointer"
                >
                  {loadingEval ? "Evaluating…" : "Evaluate with AI"}
                </Button>
                {evalError && (
                  <p className="text-red-500 text-sm mt-2">{evalError}</p>
                )}

                {evalResult && (
                  <div className="mt-4 text-sm">
                    <p className="font-medium">
                      {evalResult.ai?.summary ?? evalResult.summary}
                    </p>
                    {typeof (
                      evalResult.overall_score ?? evalResult.ai?.overall_score
                    ) === "number" && (
                      <p>
                        Score:{" "}
                        {evalResult.overall_score ??
                          evalResult.ai?.overall_score}
                      </p>
                    )}
                    {(evalResult.strengths?.length ||
                      evalResult.ai?.strengths?.length) && (
                      <div className="mt-2">
                        <p className="font-medium">Strengths</p>
                        <ul className="list-disc pl-5">
                          {(
                            evalResult.strengths ??
                            evalResult.ai?.strengths ??
                            []
                          )
                            .slice(0, 5)
                            .map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {evalResult.issues?.length ||
                    evalResult.ai?.issues?.length ? (
                      <ul className="list-disc pl-5">
                        {(evalResult.issues ?? evalResult.ai?.issues ?? [])
                          .slice(0, 5)
                          .map((i) => (
                            <li key={i.id}>
                              <span className="font-medium">{i.message}</span> —{" "}
                              {i.suggestion}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="opacity-80">
                        No AI issues returned. Heuristics:{" "}
                        {evalResult.heuristics?.notes?.join(", ") || "—"}
                      </p>
                    )}
                    {evalResult.category_scores && (
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                        {Object.entries(evalResult.category_scores).map(
                          ([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="capitalize">{k}</span>
                              <span>{v}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {(evalResult.weaknesses?.length ||
                      evalResult.ai?.weaknesses?.length) && (
                      <div className="mt-2">
                        <p className="font-medium">Weaknesses</p>
                        <ul className="list-disc pl-5">
                          {(
                            evalResult.weaknesses ??
                            evalResult.ai?.weaknesses ??
                            []
                          )
                            .slice(0, 5)
                            .map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <Button
                    onClick={exportFrames}
                    disabled={!design.fileKey || framesLoading}
                    className="cursor-pointer"
                  >
                    {framesLoading ? "Exporting…" : "Export Frames"}
                  </Button>
                  {framesLoading && (
                    <p className="text-sm mt-2">Exporting...</p>
                  )}
                  {exportedFrames.length > 0 && (
                    <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                      {exportedFrames.map((f) => (
                        <div
                          key={f.nodeId}
                          className="border rounded-md p-2 bg-white/5"
                        >
                          <Image
                            src={f.remoteUrl}
                            alt={f.nodeId}
                            width={300}
                            height={220}
                            className="w-full h-auto object-cover rounded"
                          />
                          <p className="mt-1 text-xs break-all">{f.nodeId}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
