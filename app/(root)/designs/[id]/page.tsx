"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";


type Design = {
    id: string;
    project_name: string;
    fileKey?: string;
    nodeId?: string;
    imageUrl: string,
    thumbnail?: string,
    thumbnailPath?: string,
    // Add other properties as needed
};

type ExportedFrame = {
    nodeId: string;
    remoteUrl: string;
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
    issues?: { id: string; severity: string; message: string; suggestion: string }[];
    category_scores?: Record<string, number> | null;
    ai?: {
        overall_score?: number;
        summary?: string;
        strengths?: string[];
        weaknesses?: string[]; // added
        issues?: { id: string; severity: string; message: string; suggestion: string }[];
        category_scores?: Record<string, number>;
    } | null
};

export async function evaluteDesign(input: {
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

export default function DesignDetailPage() {
    const [design, setDesign] = useState<Design | null>(null);
    // const [loading, setLoading] = useState(false);
    const [designLoading, setDesignLoading] = useState(true);
    const [framesLoading, setFramesLoading] = useState(false); // separate from evaluation
    const { id } = useParams() as { id: string };
    const [exportedFrames, setExported] = useState<ExportedFrame[]>([]);
    const [evalResult, setEvalResult] = useState<EvalResponse | null>(null);
    const [loadingEval, setLoadingEval] = useState(false);
    const [evalError, setEvalError] = useState<string | null>(null);
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);

    async function refreshSignedThumb(path: string) {
        const supabase = createClient();
        const { data: signed, error } = await supabase
            .storage
            .from("design-thumbnails")
            .createSignedUrl(path, 3600); // 1 hour
        if (!error && signed?.signedUrl) setThumbUrl(signed.signedUrl);
    }

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
                    setDesign(normalized);
                    if (data.thumbnail_url && !data.thumbnail_url.startsWith("http")) {
                        // treat as storage path
                        refreshSignedThumb(data.thumbnail_url);
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
        if (id) loadDesign();
    }, [id]);

    // Auto-evaluate (unchanged) but wait until design loaded
    useEffect(() => {
        const auto = typeof window !== "undefined" && new URLSearchParams(location.search).get("auto") === "1";
        if (!designLoading && auto && design?.fileKey && !loadingEval && !evalResult) {
            handleEvaluate();
        }
    }, [designLoading, design, loadingEval, evalResult]);

    // Auto-refresh signed Url every 50 min (before expiry)



    useEffect(() => {
        if (!design?.thumbnail || design.thumbnail.startsWith("http")) return;
        const supabaseClient = createClient();
        const refresh = async () => {
            const { data: signed } = await supabaseClient
                .storage
                .from("design-thumbnails")
                .createSignedUrl(design.thumbnail as string, 3600);
            if (signed?.signedUrl) setThumbUrl(signed.signedUrl);
        };
        // run once immediately
        refresh();
        const idRef = setInterval(refresh, 55 * 60 * 1000);
        return () => clearInterval(idRef);
    }, [design?.thumbnail]);

    async function handleEvaluate() {
        if (!design?.fileKey) return;
        setLoadingEval(true);
        setEvalError(null);
        try {
            const data = await evaluteDesign({
                fileKey: design.fileKey,
                nodeId: design.nodeId,
                scale: 3,
                fallbackImageUrl: design.thumbnail || undefined,
            });
            setEvalResult(data);
        } catch (e: any) {
            setEvalError(e.message || "Failed to evalute");
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
                    upload: false
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
    if (designLoading) return <p className="p-4">Loading Design</p>
    if (!design) return <p className="p-4">Design not found.</p>;

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">{design.project_name}</h1>

            <div className="relative w-full max-w-4xl aspect-[16/9] rounded-xl overflow-hidden">
                <Image
                    src={
                        thumbUrl
                            ? thumbUrl
                            : design.fileKey
                                ? `/api/figma/thumbnail?fileKey=${design.fileKey}${design.nodeId ? `&nodeId=${encodeURIComponent(design.nodeId)}` : ""}`
                                : "/images/design-thumbnail.png"
                    }
                    alt={design.project_name || "Design"}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Placeholder for AI evaluation content */}
            <section className="prose dark:prose-invert">
                <h2>AI Evaluation</h2>
                <Button
                    onClick={handleEvaluate}
                    disabled={!design.fileKey || loadingEval}
                    className="px-3 py-2 rounded-md disabled:opacity-50 mb-5 cursor-pointer"
                >
                    {loadingEval ? "Evaluating…" : "Evaluate with AI"}
                </Button>
                {evalError && <p className="text-red-500 text-sm mt-2">{evalError}</p>}

                {evalResult && (
                    <div className="mt-4 text-sm">
                        <p className="font-medium">
                            {evalResult.ai?.summary ?? evalResult.summary}
                        </p>
                        {typeof (evalResult.overall_score ?? evalResult.ai?.overall_score) === "number" && (
                            <p>Score: {evalResult.overall_score ?? evalResult.ai?.overall_score}</p>
                        )}
                        {(evalResult.strengths?.length || evalResult.ai?.strengths?.length) && (
                            <div className="mt-2">
                                <p className="font-medium">Strengths</p>
                                <ul className="list-disc pl-5">
                                    {(evalResult.strengths ?? evalResult.ai?.strengths ?? []).slice(0, 5).map((s, idx) => (
                                        <li key={idx}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(evalResult.issues?.length || evalResult.ai?.issues?.length) ? (
                            <ul className="list-disc pl-5">
                                {(evalResult.issues ?? evalResult.ai?.issues ?? []).slice(0, 5).map((i) => (
                                    <li key={i.id}>
                                        <span className="font-medium">{i.message}</span> — {i.suggestion}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="opacity-80">
                                No AI issues returned. Heuristics: {evalResult.heuristics?.notes?.join(", ") || "—"}
                            </p>
                        )}
                        {evalResult.category_scores && (
                            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                                {Object.entries(evalResult.category_scores).map(([k, v]) => (
                                    <div key={k} className="flex justify-between">
                                        <span className="capitalize">{k}</span>
                                        <span>{v}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(evalResult.weaknesses?.length || evalResult.ai?.weaknesses?.length) && (
                            <div className="mt-2">
                                <p className="font-medium">Weaknesses</p>
                                <ul className="list-disc pl-5">
                                    {(evalResult.weaknesses ?? evalResult.ai?.weaknesses ?? []).slice(0, 5).map((w, idx) => (
                                        <li key={idx}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                <div>
                    <Button onClick={exportFrames} disabled={!design.fileKey || framesLoading} className="cursor-pointer">
                        {framesLoading ? "Exporting…" : "Export Frames"}
                    </Button>
                    {framesLoading && <p className="text-sm mt-2">Exporting...</p>}
                    {exportedFrames.length > 0 && (
                        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                            {exportedFrames.map(f => (
                                <div key={f.nodeId} className="border rounded-md p-2 bg-white/5">
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
            </section>
            <Link href="/dashboard" className="text-blue-600 underline">Back</Link>
        </div>
    );
}