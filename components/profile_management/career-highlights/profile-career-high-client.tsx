"use client";
import { useState } from "react";
import ProfileCareerHighlights from "./profile-career-hig";
import { Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ProfileCareerHighlightsClient({
    initialHighlights,
    profileId,
}: {
    initialHighlights: string[];
    profileId: string;
}) {
    const [highlights, setHighlights] = useState(initialHighlights);
    const [showModal, setShowModal] = useState(false);
    const [newHighlight, setNewHighlight] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!newHighlight.trim()) return;
        setLoading(true);

        const supabase = createClient();
        const updated = [...highlights, newHighlight.trim()];

        const { error } = await supabase
            .from("profile_details")
            .update({ career_highlights: updated })
            .eq("profile_id", profileId);

        setLoading(false);

        if (!error) {
            setHighlights(updated);
            setNewHighlight("");
            setShowModal(false);
        } else {
            alert("Failed to add highlight. Please try again.");
        }
    };

    return (
        <>
            <div className="relative">
                <ProfileCareerHighlights highlights={highlights} />
                <button
                    onClick={() => setShowModal(true)}
                    className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Add Highlight"
                    aria-label="Add Highlight"
                >
                    <Plus size={18} className="text-gray-700 dark:text-gray-200" />
                </button>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-xl p-6 shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4 text-[#1A1A1A] dark:text-white">
                            Add Career Highlight
                        </h3>
                        <input
                            className="w-full border rounded p-2 mb-4 text-sm text-black dark:text-white bg-gray-50 dark:bg-gray-800"
                            value={newHighlight}
                            onChange={e => setNewHighlight(e.target.value)}
                            autoFocus
                            disabled={loading}
                            placeholder="e.g. Launched 10+ inclusive web products"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                className="px-3 py-1 rounded bg-[#ED5E20] text-white hover:bg-[#d94e13] transition"
                                disabled={loading}
                            >
                                {loading ? "Adding..." : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}