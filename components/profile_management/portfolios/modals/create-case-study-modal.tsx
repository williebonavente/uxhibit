"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { X } from "lucide-react";
import { CaseStudy } from "../../types";

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated?: (work: CaseStudy) => void;
    userId: string;
    initialData?: CaseStudy;
    isEdit?: boolean;
}

export default function CreateCaseStudyModal({ open,
    onClose,
    onCreated,
    userId,
    initialData,
    isEdit
}: Props) {
    const [title, setTitle] = useState("");
    const [image, setImage] = useState("");
    const [link, setLink] = useState("");
    const [summary, setSummary] = useState("");
    const [outcome, setOutcome] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"figma" | "manual" | null>(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || "");
            setImage(initialData.image || "");
            setLink(initialData.link || "");
            setSummary(initialData.summary || "");
            setOutcome(initialData.outcome || "");
        } else {
            setTitle("");
            setImage("");
            setLink("");
            setSummary("");
            setOutcome("");

        }
    }, [initialData, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const supabase = createClient();

        if (isEdit && initialData?.id) {
            try {
                const { data, error } = await supabase
                    .from("case_studies")
                    .update({
                        title,
                        image,
                        link,
                        summary,
                        outcome,
                    })
                    .eq("id", initialData.id)
                    .select()
                    .single();
                setSaving(false);
                if (error) {
                    setError("Failed to update case study");
                    toast.error("Failed to update case study");
                } else {
                    console.log("Update success:", data);
                    toast.success("Case study updated!");
                    if (onCreated) onCreated(data);
                    onClose();
                }
            } catch (err) {
                setSaving(false);
                toast(`${err}`);
                setError("Exception during update");
            }
        } else {
            try {
                const { data, error } = await supabase
                    .from("case_studies")
                    .insert({
                        user_id: userId,
                        title,
                        image,
                        link,
                        summary,
                        outcome,
                        created_at: new Date().toISOString(),
                    })
                    .select()
                    .single();
                setSaving(false);
                if (error) {
                    setError("Failed to add case study");
                    toast.error("Failed to add case study");
                } else {
                    toast.success("Case study added!");
                    if (onCreated) onCreated(data);
                    onClose();
                }
            } catch (err) {
                setSaving(false);
                console.error("Exception during insert:", err);
                setError("Exception during insert");
            }
        }
    };
    const fetchFigmaMeta = async (figmaUrl: string) => {
        setImporting(true);
        try {
            const res = await fetch("/api/figma/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: figmaUrl }),
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
                setImporting(false);
                return;
            }
            if (data.name) setTitle(data.name);
            if (data.thumbnailUrl) setImage(data.thumbnailUrl);
            setLink(figmaUrl);
            toast.success("Figma data imported!");
        } catch (err) {
            toast.error("Failed to fetch Figma data.");
            console.error(err);
        }
        setImporting(false);
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
        >
            <div
                className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-2xl
                   p-6 sm:p-8 md:p-10 bg-white dark:bg-[#1A1A1A]
                   rounded-2xl shadow-xl border border-white/20 text-center cursor-default"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="cursor-pointer absolute top-4 right-4 p-2 rounded-full bg-white/70 dark:bg-neutral-800/70 hover:bg-orange-100 dark:hover:bg-[#ED5E20]/20 transition"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-6">
                    {isEdit
                        ? "Edit Case Study"
                        : mode === "figma"
                            ? "Import from Figma"
                            : mode === "manual"
                                ? "Add Case Study"
                                : "Add Case Study"}
                </h3>

                {/* Mode Selection */}
                {(!isEdit && mode === null) && (
                    <div className="flex flex-col gap-4 mb-6">
                        <h4 className="text-lg font-semibold text-center">How would you like to add your Case Study?</h4>
                        <div className="flex gap-4 justify-center">
                            <button
                                className={`group relative inline-flex items-center justify-center
                                    px-6 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                                    transition-all duration-300 overflow-hidden
                                    focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                                    cursor-pointer`}
                                onClick={() => setMode("figma")}
                            >
                                <span
                                    aria-hidden
                                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                                />
                                <span
                                    aria-hidden
                                    className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06))] backdrop-blur-[2px]"
                                />
                                <span
                                    aria-hidden
                                    className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                                >
                                    <span className="absolute inset-y-0 -left-full w-1/2 
                                    bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 
                                    transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                                </span>
                                <span className="relative z-10">
                                    Import from Figma
                                </span>
                            </button>
                            <button
                                className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-medium
                                border border-neutral-300/70 dark:border-neutral-600/60 
                                bg-white/60 dark:bg-neutral-800/50
                                text-neutral-700 dark:text-neutral-200
                                shadow-sm backdrop-blur
                                hover:bg-white/80 dark:hover:bg-neutral-800/70
                                transition-colors cursor-pointer"
                                onClick={() => setMode("manual")}
                            >
                                Manual Entry
                            </button>
                        </div>
                    </div>
                )}

                {/* Figma Import Mode */}
                {(!isEdit && mode === "figma") && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        {/* Only show import UI if not imported yet */}
                        {!title && (
                            <>
                                <label className="flex flex-col items-start gap-1 w-full">
                                    <span>
                                        Figma Link <span className="text-red-500">*</span>
                                    </span>
                                    <div className="flex gap-2 w-full">
                                        <input
                                            className="border rounded px-2 py-1 w-full"
                                            placeholder="https://www.figma.com/design/"
                                            value={link}
                                            onChange={e => setLink(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className={`group relative inline-flex items-center justify-center
                                        px-6 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                                        transition-all duration-300 overflow-hidden
                                        focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                                        ${(!link.trim() || importing) ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                            onClick={() => fetchFigmaMeta(link)}
                                            disabled={!link.trim() || importing}
                                        >
                                            {/* Gradient and overlay spans */}
                                            <span
                                                aria-hidden
                                                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                                            />
                                            <span
                                                aria-hidden
                                                className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06))] backdrop-blur-[2px]"
                                            />
                                            <span
                                                aria-hidden
                                                className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                                            >
                                                <span className="absolute inset-y-0 -left-full w-1/2 
                                            bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 
                                            transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                                            </span>
                                            <span className="relative z-10 flex items-center">
                                                {importing ? (
                                                    <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                                    </svg>
                                                ) : null}
                                                Import
                                            </span>
                                        </button>
                                    </div>
                                </label>

                                {/* Back button, only show if not importing */}
                                {!importing && (
                                    <button
                                        type="button"
                                        onClick={() => setMode(null)}
                                        className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                                                border border-neutral-300/70 dark:border-neutral-600/60 
                                                bg-white/60 dark:bg-neutral-800/50
                                                text-neutral-700 dark:text-neutral-200
                                                shadow-sm backdrop-blur
                                                hover:bg-white/80 dark:hover:bg-neutral-800/70
                                                hover:border-neutral-400 da rk:hover:border-neutral-500
                                                transition-colors
                                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                                                focus:ring-offset-white dark:focus:ring- cursor-pointer"
                                    >
                                        <svg
                                            className="h-3.5 w-3.5 opacity-80"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M13 17l-5-5 5-5" />
                                        </svg>
                                        Back
                                    </button>
                                )}
                            </>
                        )}

                        {/* Show the rest of the form after import */}
                        {title && (
                            <>
                                <label className="flex flex-col items-start gap-1 w-full">
                                    <span>Title <span className="text-red-500">*</span></span>
                                    <input
                                        className="border rounded px-2 py-1 w-full"
                                        placeholder="Title"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    />
                                </label>
                                <label className="flex flex-col items-start gap-1 w-full">
                                    <span>Thumbnail URL <span className="text-red-500">*</span></span>
                                    <input
                                        className="border rounded px-2 py-1 w-full"
                                        placeholder="https://www.todayifoundout.com/wp-content/uploads/2017/11/rick-astley-340x252.png"
                                        value={image}
                                        onChange={e => setImage(e.target.value)}
                                        required
                                    />
                                </label>
                                <label className="flex flex-col items-start gap-1 w-full">
                                    <span>Figma Link <span className="text-red-500">*</span></span>
                                    <input
                                        className="border rounded px-2 py-1 w-full bg-gray-100 dark:bg-neutral-800 cursor-not-allowed"
                                        value={link}
                                        readOnly
                                        tabIndex={-1}
                                        required
                                    />
                                </label>
                                <label className="flex flex-col items-start gap-1 w-full">
                                    <span>
                                        Summary <span className="text-red-500">*</span>
                                    </span>
                                    <textarea
                                        className="border rounded px-2 py-1 w-full min-h-[80px] resize-none"
                                        placeholder="Summary"
                                        value={summary}
                                        onChange={e => setSummary(e.target.value)}
                                        required
                                    />
                                </label>
                                <label className="flex flex-col items-start gap-1 w-full">
                                    <span>
                                        Outcome <span className="text-red-500">*</span>
                                    </span>
                                    <input
                                        className="border rounded px-2 py-1 w-full"
                                        placeholder="15% visting rate"
                                        value={outcome}
                                        onChange={e => setOutcome(e.target.value)}
                                        required
                                    />
                                </label>
                                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                                {(!isEdit && mode !== null && title) && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center justify-between mt-4">
                                            {!isEdit && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMode(null)}
                                                    className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium
                                                    border border-neutral-300/70 dark:border-neutral-600/60 
                                                    bg-white/60 dark:bg-neutral-800/50
                                                    text-neutral-700 dark:text-neutral-200
                                                    shadow-sm backdrop-blur
                                                    hover:bg-white/80 dark:hover:bg-neutral-800/70
                                                    hover:border-neutral-400 dark:hover:border-neutral-500
                                                    transition-colors
                                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                                                    focus:ring-offset-white dark:focus:ring- cursor-pointer"
                                                >
                                                    <svg
                                                        className="h-4 w-4 opacity-80"
                                                        viewBox="0 0 20 20"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M13 17l-5-5 5-5" />
                                                    </svg>
                                                    Back
                                                </button>
                                            )}
                                            <div className="flex gap-3">
                                                {/* Cancel and Save buttons */}
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                disabled={saving}
                                                className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-medium
                                            border border-neutral-300/70 dark:border-neutral-600/60 
                                            bg-white/60 dark:bg-neutral-800/50
                                            text-neutral-700 dark:text-neutral-200
                                            shadow-sm backdrop-blur
                                            hover:bg-white/80 dark:hover:bg-neutral-800/70
                                            transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="cursor-pointer group relative inline-flex items-center justify-center
                                            px-6 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                                            transition-all duration-300 overflow-hidden
                                            focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {/* Gradient and overlay spans */}
                                                <span
                                                    aria-hidden
                                                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                                                />
                                                <span
                                                    aria-hidden
                                                    className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06))] backdrop-blur-[2px]"
                                                />
                                                <span
                                                    aria-hidden
                                                    className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                                                >
                                                    <span className="absolute inset-y-0 -left-full w-1/2 
                                                    bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 
                                                    transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                                                </span>
                                                <span className="relative z-10">
                                                    {saving ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save" : "Add")}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </form>
                )}

                {/* Manual Entry or Edit Mode */}
                {(isEdit || mode === "manual") && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <label className="flex flex-col items-start gap-1 w-full">
                            <span>
                                Title <span className="text-red-500">*</span>
                            </span>
                            <input
                                className="border rounded px-2 py-1 w-full"
                                placeholder="Title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </label>
                        <label className="flex flex-col items-start gap-1 w-full">
                            <span>Thumbnail URL<span className="text-red-500">*</span>
                            </span>
                            <input
                                className="border rounded px-2 py-1 w-full"
                                placeholder="https://www.todayifoundout.com/wp-content/uploads/2017/11/rick-astley-340x252.png"
                                value={image}
                                onChange={e => setImage(e.target.value)}
                                required
                            />
                        </label>
                        <label className="flex flex-col items-start gap-1 w-full">
                            <span>
                                Figma/Portfolio Link <span className="text-red-500">*</span>
                            </span>
                            <input
                                className="border rounded px-2 py-1 w-full"
                                placeholder="https://www.figma.com/design/"
                                value={link}
                                onChange={e => setLink(e.target.value)}
                                required
                            />
                        </label>
                        <label className="flex flex-col items-start gap-1 w-full">
                            <span>
                                Summary <span className="text-red-500">*</span>
                            </span>
                            <textarea
                                className="border rounded px-2 py-1 w-full min-h-[80px] resize-none"
                                placeholder="Summary"
                                value={summary}
                                onChange={e => setSummary(e.target.value)}
                                required
                            />
                        </label>
                        <label className="flex flex-col items-start gap-1 w-full">
                            <span>
                                Outcome <span className="text-red-500">*</span>
                            </span>
                            <input
                                className="border rounded px-2 py-1 w-full"
                                placeholder="15% visting rate"
                                value={outcome}
                                onChange={e => setOutcome(e.target.value)}
                                required
                            />
                        </label>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        {(isEdit || mode === "manual") && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center justify-between mt-4">
                                    {!isEdit && (
                                        <button
                                            type="button"
                                            onClick={() => setMode(null)}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium
                                                border border-neutral-300/70 dark:border-neutral-600/60 
                                                bg-white/60 dark:bg-neutral-800/50
                                                text-neutral-700 dark:text-neutral-200
                                                shadow-sm backdrop-blur
                                                hover:bg-white/80 dark:hover:bg-neutral-800/70
                                                hover:border-neutral-400 dark:hover:border-neutral-500
                                                transition-colors
                                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                                                focus:ring-offset-white dark:focus:ring- cursor-pointer"
                                        >
                                            <svg
                                                className="h-4 w-4 opacity-80"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M13 17l-5-5 5-5" />
                                            </svg>
                                            Back
                                        </button>
                                    )}
                                    <div className="flex gap-3">
                                        {/* Cancel and Save buttons */}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={saving}
                                        className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-medium
                                        border border-neutral-300/70 dark:border-neutral-600/60 
                                        bg-white/60 dark:bg-neutral-800/50
                                        text-neutral-700 dark:text-neutral-200
                                        shadow-sm backdrop-blur
                                        hover:bg-white/80 dark:hover:bg-neutral-800/70
                                        transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="group relative inline-flex items-center justify-center
                                        px-6 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                                        transition-all duration-300 overflow-hidden
                                        focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                                        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {/* Gradient and overlay spans */}
                                        <span
                                            aria-hidden
                                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                                        />
                                        <span
                                            aria-hidden
                                            className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06))] backdrop-blur-[2px]"
                                        />
                                        <span
                                            aria-hidden
                                            className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                                        >
                                            <span className="absolute inset-y-0 -left-full w-1/2 
                                                bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 
                                                transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                                        </span>
                                        <span className="relative z-10">
                                            {saving ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save" : "Add")}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}