"use client";
import { useState, useRef, useEffect } from "react";
import ProfileCareerHighlights, { Highlight } from "./profile-career-hig";
import { createClient } from "@/utils/supabase/client";
import RichTextEditor from "@/components/rich-editor/rich-text-editor";
import { ChevronDown } from "lucide-react";


export default function ProfileCareerHighlightsClient({
    initialHighlights,
    profileId,
}: {
    initialHighlights: Highlight[];
    profileId: string;
}) {
    const parseHighlights = (raw: any[]): Highlight[] =>
        raw.map(h => typeof h === "string" ? JSON.parse(h) : h);

    const [showModal, setShowModal] = useState(false);
    const [newHighlight, setNewHighlight] = useState("");
    const [selectedIcon, setSelectedIcon] = useState<Highlight["icon"]>("book");
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>(parseHighlights(initialHighlights));

    const editorRef = useRef<{ commands: { focus: () => void } } | null>(null);

    // Focus editor when modal opens
    useEffect(() => {
        if (showModal && editorRef.current) {
            setTimeout(() => {
                editorRef.current?.commands.focus();
            }, 100);
        }
    }, [showModal]);

    // Add or Edit highlight
    const handleSave = async () => {
        if (!newHighlight.trim() || newHighlight === "<p></p>") return;
        setLoading(true);
        setError(null);

        let updated: Highlight[];
        if (editIndex !== null) {
            updated = highlights.map((h, i) =>
                i === editIndex ? { icon: selectedIcon, content: newHighlight.trim() } : h
            );
        } else {
            updated = [...highlights, { icon: selectedIcon, content: newHighlight.trim() }];
        }

        const supabase = createClient();
        const { error } = await supabase
            .from("profile_details")
            .update({ career_highlights: updated })
            .eq("profile_id", profileId);

        setLoading(false);

        if (!error) {
            setHighlights(updated);
            setNewHighlight("");
            setSelectedIcon("book");
            setEditIndex(null);
            setShowModal(false);
        } else {
            setError("Failed to save highlight. Please try again.");
        }
    };

    // Delete highlight
    const handleDelete = async (index: number) => {
        setLoading(true);
        setError(null);
        const updated = highlights.filter((_, i) => i !== index);

        const supabase = createClient();
        const { error } = await supabase
            .from("profile_details")
            .update({ career_highlights: updated })
            .eq("profile_id", profileId);

        setLoading(false);

        if (!error) {
            setHighlights(updated);
        } else {
            setError("Failed to delete highlight. Please try again.");
        }
    };

    // Open modal for add or edit
    const openModal = (index?: number) => {
        if (typeof index === "number") {
            setEditIndex(index);
            setNewHighlight(highlights[index].content);
            setSelectedIcon(highlights[index].icon);
        } else {
            setEditIndex(null);
            setNewHighlight("");
            setSelectedIcon("book");
        }
        setShowModal(true);
        setError(null);
    };

    return (
        <>
            <ProfileCareerHighlights
                highlights={highlights}
                editable={true}
                onAddHighlight={() => openModal()}
                onEditHighlight={openModal}
                onDeleteHighlight={handleDelete} 
                profileDetailsId={profileId}           
                />
            <div
                style={{ display: showModal ? "block" : "none" }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-8 shadow-2xl w-full max-w-lg mx-auto border border-gray-200 dark:border-gray-800">
                    <h3 className="text-xl font-bold mb-6 text-[#1A1A1A] dark:text-white">
                        {editIndex !== null ? "Edit Career Highlight" : "Add Career Highlight"}
                    </h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-[#1A1A1A] dark:text-white">
                            Choose Icon
                        </label>
                        <div className="relative">
                            <select
                                value={selectedIcon}
                                onChange={e => {
                                    setSelectedIcon(e.target.value as Highlight["icon"]);
                                    setTimeout(() => {
                                        editorRef.current?.commands.focus();
                                    }, 100);
                                }}
                                className="w-full border cursor-pointer rounded p-2 bg-gray-50 dark:bg-gray-800 text-black dark:text-white appearance-none transition focus:ring-2 focus:ring-[#ED5E20] focus:border-[#ED5E20] hover:shadow-lg"
                                disabled={loading}
                                style={{
                                    fontSize: "1.15rem",
                                    fontWeight: 500,
                                    letterSpacing: "0.03em",
                                    height: "44px",         // Limit the height of the select box itself
                                    maxHeight: "220px",     // Limit dropdown height when open
                                    overflowY: "auto",      // Enable scroll for dropdown
                                }}
                            >
                                <optgroup label="Achievements">
                                    <option value="book">📚 Book</option>
                                    <option value="trophy">🏆 Trophy</option>
                                    <option value="medal">🥇 Medal</option>
                                    <option value="diamond">💎 Diamond</option>
                                    <option value="star">⭐ Star</option>
                                    <option value="mountain">⛰️ Mountain</option>
                                </optgroup>
                                <optgroup label="Celebration">
                                    <option value="party">🎉 Party</option>
                                    <option value="fireworks">🎆 Fireworks</option>
                                    <option value="sparkles">✨ Sparkles</option>
                                </optgroup>
                                <optgroup label="Energy">
                                    <option value="fire">🔥 Fire</option>
                                    <option value="muscle">💪 Muscle</option>
                                    <option value="rocket">🚀 Rocket</option>
                                    <option value="thumbsup">👍 Thumbs Up</option>
                                    <option value="clap">👏 Clap</option>
                                </optgroup>
                                <optgroup label="Mind & Heart">
                                    <option value="brain">🧠 Brain</option>
                                    <option value="lightbulb">💡 Lightbulb</option>
                                    <option value="heart">❤️ Heart</option>
                                </optgroup>
                                <optgroup label="Nature">
                                    <option value="sun">🌞 Sun</option>
                                    <option value="moon">🌙 Moon</option>
                                    <option value="globe">🌍 Globe</option>
                                </optgroup>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                                <ChevronDown
                                    size={22}
                                    className="transition-colors duration-300 text-[#1A3556] dark:text-[#7FB3FF]"
                                />
                            </span>
                        </div>
                    </div>
                    <RichTextEditor
                        ref={editorRef}
                        value={newHighlight}
                        onChange={setNewHighlight}
                        disabled={loading}
                        className="min-h-[700px] max-h-[500px] overflow-auto w-full max-w-2xl mx-auto rounded-lg bg-white dark:bg-[#1A1A1A]"
                    />
                    {error && (
                        <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                    <hr className="my-6 border-gray-200 dark:border-gray-700" />
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            {/* Hide Delete button when saving */}
                            {editIndex !== null && !loading && (
                                <button
                                    onClick={() => handleDelete(editIndex)}
                                    className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium cursor-pointer"
                                    disabled={loading}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {/* Hide Cancel button when saving */}
                            {!(editIndex === null && loading) && !loading && (
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditIndex(null);
                                        setNewHighlight("");
                                        setSelectedIcon("book");
                                        setError(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium cursor-pointer"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            )}
                            {/* Hide Add/Save button when saving */}
                            {!loading && (
                                <button
                                    onClick={handleSave}
                                    className={`px-4 py-2 rounded-lg transition font-medium cursor-pointer
                                            ${(editIndex === null)
                                            ? "bg-[#ED5E20] text-white hover:bg-[#d94e13] dark:bg-[#ED5E20] dark:text-white dark:hover:bg-[#d94e13]"
                                            : "bg-[#ED5E20] text-white hover:bg-[#d94e13] dark:bg-[#ED5E20] dark:text-white dark:hover:bg-[#d94e13]"
                                        }`}
                                    disabled={loading || !newHighlight}
                                >
                                    {editIndex !== null ? "Save" : "Add"}
                                </button>
                            )}
                            {/* Show only loading text when saving */}
                            {loading && (
                                <button
                                    className={`px-4 py-2 rounded-lg transition font-medium cursor-not-allowed
                                        ${(editIndex === null)
                                            ? "bg-[#2563eb] text-white dark:bg-[#283645] dark:text-[#dae3ed]"
                                            : "bg-[#2563eb] text-white dark:bg-[#283645] dark:text-[#dae3ed]"
                                        }
                                        `}
                                    disabled
                                >
                                    {editIndex !== null ? "Saving..." : "Adding..."}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}