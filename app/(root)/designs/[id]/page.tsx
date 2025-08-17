"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
type Design = {
    id: string;
    project_name: string;
    fileKey?: string;
    nodeId?: string;
    imageUrl: string,
    thumbnail?: string,
    // Add other properties as needed
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
    const { id } = useParams() as { id: string };

    const [evalResult, setEvalResult] = useState<EvalResponse | null>(null);
    const [loadingEval, setLoadingEval] = useState(false);
    const [evalError, setEvalError] = useState<string | null>(null);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("designs") || "[]");
        setDesign(stored.find((d: Design) => d.id === id) || null);
    }, [id]);

    useEffect(() => {
        const auto = typeof window !== "undefined" && new URLSearchParams(location.search).get("auto") === "1";
        if (auto && design?.fileKey && !loadingEval && !evalResult) {
            handleEvaluate();
        }
    });
    async function handleEvaluate() {
        if (!design?.fileKey) return;
        setLoadingEval(true);
        setEvalError(null);
        // try {
        //     const r = await fetch("/api/ai/evaluate", {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify({
        //             fileKey: design.fileKey,
        //             nodeId: design.nodeId,
        //             scale: 3,
        //             fallbackImageUrl: design.thumbnail || undefined,   // added
        //         }),
        //     });
        //     const data = await r.json();
        //     if (!r.ok) throw new Error(data?.error || "Failed to evaluate");
        //     setEvalResult(data);
        // } catch (e: any) {
        //     setEvalError(e.message || "Failed to evaluate");
        // } finally {
        //     setLoadingEval(false);
        // }

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

    if (!design) return <p className="p-4">Design not found.</p>;

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">{design.project_name}</h1>

            <div className="relative w-full max-w-4xl aspect-[16/9] rounded-xl overflow-hidden">
                <Image
                    src={
                        design.fileKey
                            ? `/api/figma/thumbnail?fileKey=${design.fileKey}${design.nodeId ? `&nodeId=${encodeURIComponent(design.nodeId)}` : ""
                            }`
                            : "/images/design-thumbnail.png"
                    }
                    alt={design.project_name || "Figma Preview"}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Placeholder for AI evaluation content */}
            <section className="prose dark:prose-invert">
                <h2>AI Evaluation</h2>
                <button
                    onClick={handleEvaluate}
                    disabled={!design.fileKey || loadingEval}
                    className="px-3 py-2 rounded-md bg-black text-white disabled:opacity-50"
                >
                    {loadingEval ? "Evaluating…" : "Evaluate with AI"}
                </button>
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
            </section>

            <Link href="/" className="text-blue-600 underline">Back</Link>
        </div>
    );
}