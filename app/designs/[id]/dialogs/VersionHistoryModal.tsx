import React from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/shadcn-io/spinner/index";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface VersionHistoryModalProps {
    open: boolean;
    onClose: () => void;
    loadingVersions: boolean;
    versions: any[];
    page: number;
    pageSize: number;
    setPage: (page: number) => void;
    design: any;
    selectedVersion: any;
    setSelectedVersion: (v: any) => void;
    fetchDesignVersions: (id: string) => Promise<any[]>;
    deleteDesignVersion: (id: string) => Promise<void>;
    setVersions: (v: any[]) => void;
    setVersionChanged: (fn: (v: number) => number) => void;
    setEvalResult: (result: any) => void;
    setShowEval: (show: boolean) => void;
    setFrameEvaluations: (frames: any[]) => void;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
    open,
    onClose,
    loadingVersions,
    versions,
    page,
    pageSize,
    setPage,
    design,
    selectedVersion,
    setSelectedVersion,
    fetchDesignVersions,
    deleteDesignVersion,
    setVersions,
    setVersionChanged,
    setEvalResult,
    setShowEval,
    setFrameEvaluations

}) => {
    if (!open) return null;

    async function fetchFramesForVersion(versionId: string, designId: string) {
        const supabase = createClient();

        // Fetch the overall summary for this version
        const { data: versionData, error: versionError } = await supabase
            .from("design_versions")
            .select(`
            id, design_id, version, file_key, node_id, thumbnail_url, created_by,
            ai_summary, ai_data, snapshot, created_at, updated_at, total_score
        `)
            .eq("design_id", designId)
            .eq("id", versionId)
            .maybeSingle();

        if (versionError) {
            console.error("Failed to fetch overall evaluation:", versionError.message);
            return [];
        }
        if (!versionData) {
            console.warn("No version data found for design:", designId, "version:", versionId);
            return [];
        }

        // Parse AI data for the overall frame
        let aiData = versionData.ai_data;
        if (typeof aiData === "string") {
            try {
                aiData = JSON.parse(aiData);
            } catch (e) {
                aiData = {};
            }
        }

        const overall = {
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

        // Fetch all frames for this version
        const { data: frameData, error: frameError } = await supabase
            .from("design_frame_evaluations")
            .select("*")
            .eq("design_id", designId)
            .eq("version_id", versionId)
            .order("created_at", { ascending: true });

        if (frameError) {
            console.error("Failed to fetch frame evaluations for version:", frameError.message);
            return [overall];
        }

        const frames = (frameData || []).map((frame: any) => ({
            ...frame,
            ai_data: typeof frame.ai_data === "string" ? JSON.parse(frame.ai_data) : frame.ai_data,
        }));

        // Combine overall and frames
        return [overall, ...frames];
    }
    return (
        <div className="fixed inset-0 flex items-center justify-center pl-20 pr-20 cursor-pointer z-50">
            <div
                className="absolute inset-0 bg-black/50 transition-opacity backdrop-blur-md"
                onClick={onClose}
            />
            <div className="bg-gray-50 border dark:bg-[#1A1A1A] relative rounded-xl p-10 w-[1100px] max-h-[85vh] overflow-y-auto w-full z-50">
                <h2 className="text-lg font-semibold mb-3 relative flex items-center justify-center">
                    <span className="mx-auto">Version History</span>
                    <button
                        onClick={onClose}
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
                                                        const frames = await fetchFramesForVersion(v.id, design.id);
                                                        setFrameEvaluations(frames);
                                                        const versions = await fetchDesignVersions(design.id);
                                                        const latest = versions.find(ver => ver.id === v.id);

                                                        if (!latest) {
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
                                                        onClose();
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
                                                    {v.total_score !== undefined && v.total_score !== null ? Math.round(v.total_score) : "-"}
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
                                onClick={() => setPage(Math.max(0, page - 1))}
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
                                onClick={() => setPage(Math.min(Math.ceil(versions.length / pageSize) - 1, page + 1))}
                                disabled={(page + 1) * pageSize >= versions.length}
                                className={`group relative flex items-center justify-center px-4 py-2 rounded-full
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
    );
};

export default VersionHistoryModal;