import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Loader2, X, Check } from "lucide-react";


type ProfileSkillFormProps = {
    skills: string[];
    profileId: string;
    onSave?: (skills: string[]) => void;
    onCancel?: () => void;
    onSkillsChange?: (skills: string[]) => void;
};

const ProfileSkillForm: React.FC<ProfileSkillFormProps> = ({
    skills: initialSkills,
    profileId,
    onCancel,
    onSkillsChange
}) => {
    const [page, setPage] = useState(1);
    const [skills, setSkills] = useState<string[]>(initialSkills);
    const [newSkill, setNewSkill] = useState("");
    const [addLoading, setAddLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [showAddInput, setShowAddInput] = useState(false);

    const ITEMS_PER_PAGE = 5;

    const totalPages = Math.max(1, Math.ceil(skills.length / ITEMS_PER_PAGE));

    const paginatedSkills = skills.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );
    const supabase = createClient();

    // Add Skill
    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;

        const normalizedNewSkill = newSkill.trim().toLowerCase();
        const skillExists = skills.some(s => s.trim().toLowerCase() === normalizedNewSkill);
        if (skillExists) {
            toast.error("This skill is already in place. Would you mind adding another skill?");
            setAddLoading(false);
            return;
        }

        setAddLoading(true);
        setError(null);

        try {
            const { data: skillRows } = await supabase
                .from("skills")
                .select("id")
                .eq("name", newSkill.trim())
                .single();

            let skillId: string;

            if (skillRows && skillRows.id) {
                skillId = skillRows.id;
            } else {
                const { data: insertedSkill, error: insertSkillError } = await supabase
                    .from("skills")
                    .insert({ name: newSkill.trim() })
                    .select("id")
                    .single();

                if (insertSkillError || !insertedSkill) {
                    throw insertSkillError || new Error("Failed to insert skill");
                }
                skillId = insertedSkill.id;
            }

            const { error: profileSkillError } = await supabase
                .from("profile_skills")
                .insert({ profile_id: profileId, skills_id: skillId });

            if (profileSkillError) {
                if (
                    profileSkillError.message.includes("duplicate key") ||
                    profileSkillError.message.includes("unique constraint")
                ) {
                    toast.error("This skill is already in place. Would you mind adding another skill?");
                    return;
                }
                throw profileSkillError;
            }

            // HOTFIX: Re-fetch the user's skills from the DB
            const { data: updatedSkills, error: fetchError } = await supabase
                .from("profile_skills")
                .select("skills(name)")
                .eq("profile_id", profileId);

            if (fetchError) {
                throw fetchError;
            }

            // updatedSkills is an array of objects like { skills: { name: "SkillName" } }
            setSkills(updatedSkills.map((row: any) => row.skills.name));
            if (onSkillsChange) onSkillsChange(updatedSkills.map((row: any) => row.skills.name));
            setNewSkill("");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || "Error adding skill");
            } else {
                setError("Unknown error adding skill");
            }
        } finally {
            setAddLoading(false);
        }
    };

    // Delete Skill
    const handleDeleteSkill = async (skillName: string, index: number) => {
        setError(null);

        try {
            const { data: skillRow } = await supabase
                .from("skills")
                .select("id")
                .eq("name", skillName)
                .single();

            if (!skillRow) throw new Error("Skill not found");

            const { error: deleteError } = await supabase
                .from("profile_skills")
                .delete()
                .eq("profile_id", profileId)
                .eq("skills_id", skillRow.id);

            if (deleteError) throw deleteError;

            // HOTFIX: Re-fetch the user's skills from the DB
            const { data: updatedSkills, error: fetchError } = await supabase
                .from("profile_skills")
                .select("skills(name)")
                .eq("profile_id", profileId);

            if (fetchError) {
                throw fetchError;
            }

            setSkills(updatedSkills.map((row: any) => row.skills.name));
            if (onSkillsChange) onSkillsChange(updatedSkills.map((row: any) => row.skills.name));

            // After setSkills(...) and onSkillsChange(...)
            const newTotalPages = Math.max(1, Math.ceil(updatedSkills.length / ITEMS_PER_PAGE));
            if (page > newTotalPages) setPage(newTotalPages);

        } catch (err: any) {
            setError(err.message || "Error deleting skill");
        }
    };

    const handleEditSkill = async (oldSkillName: string, newSkillName: string, index: number) => {
        setEditLoading(true);
        setError(null);

        // Case-insensitive duplicate check (excluding the current skill)
        const normalizedEditValue = newSkillName.trim().toLowerCase();
        const skillExists = skills.some(
            (s, idx) => idx !== index && s.trim().toLowerCase() === normalizedEditValue
        );
        if (skillExists) {
            toast.error("A skill with this name already exists. Please choose a different name.");
            setEditLoading(false);
            return;
        }

        try {
            const { data: oldSkillRow } = await supabase
                .from("skills")
                .select("id")
                .eq("name", oldSkillName)
                .single();

            if (!oldSkillRow) throw new Error("Skill not found");

            const { error: updateError } = await supabase
                .from("skills")
                .update({ name: newSkillName })
                .eq("id", oldSkillRow.id);

            if (updateError) {
                if (
                    updateError.message.includes("duplicate key") ||
                    updateError.message.includes("unique constraint")
                ) {
                    toast.error("A skill with this name already exists. Please choose a different name.");
                    return;
                }
                throw updateError;
            }

            const updatedSkills = [...skills];
            updatedSkills[index] = newSkillName;
            setSkills(updatedSkills);
            if (onSkillsChange) onSkillsChange(updatedSkills);
        } catch (err: any) {
            const message = err?.message || "Error updating skill";
            toast.error(message);
        } finally {
            setEditLoading(false);
            setEditingIndex(null);
            setEditValue("");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl p-8 w-full max-w-xl mx-4 relative">
                {/* X icon button at top right */}
                <div className="absolute top-4 right-4 z-10 flex items-center">
                    <button
                        type="button"
                        className="cursor-pointer p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                        onClick={onCancel}
                        aria-label="Close"
                        disabled={addLoading || editLoading}
                    >
                        <X size={22} className="text-gray-500 dark:text-gray-300" />
                    </button>
                </div>
                {/* Header row: Title only, no Add button */}
                <div className="flex items-center justify-between mb-6">
                    <h2
                        className="flex-1 text-xl font-semibold text-[#ED5E20] dark:text-orange-300 text-center"
                        id="skills-modal-title"
                        tabIndex={-1}
                    >
                        Manage Skills &amp; Tools
                    </h2>
                </div>

                <table className="w-full mb-4 border-separate border-spacing-y-2">
                    <thead>
                        <tr className="text-left text-sm text-gray-700 dark:text-gray-200">
                            <th className="pl-2">Skill/Tool</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSkills.map((skill, i) => (
                            <tr key={i} className="bg-gray-50 dark:bg-gray-900 rounded">
                                <td className="pl-2 py-2">
                                    {editingIndex === i ? (
                                        <input
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            className="border rounded px-2 py-1 w-full"
                                            disabled={editLoading}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="font-medium">{skill}</span>
                                    )}
                                </td>
                                <td className="py-2 text-center">
                                    {editingIndex === i ? (
                                        <>
                                            <button
                                                onClick={() => handleEditSkill(skill, editValue, i)}
                                                className="cursor-pointer p-2 rounded-full bg-green-500 hover:bg-green-600 text-white mr-2"
                                                disabled={editLoading || !editValue.trim()}
                                                title="Save"
                                                aria-label="Save"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => { setEditingIndex(null); setEditValue(""); }}
                                                className="cursor-pointer p-2 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800"
                                                disabled={editLoading}
                                                title="Cancel"
                                                aria-label="Cancel"
                                            >
                                                <X size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => { setEditingIndex(i); setEditValue(skill); }}
                                                className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-300 transition-colors mr-2 cursor-pointer"
                                                disabled={editLoading}
                                                title="Edit"
                                                aria-label="Edit skill"
                                            >
                                                <Pencil size={18} className="text-yellow-700" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSkill(skill, i)}
                                                className="p-2 rounded-full bg-red-100 hover:bg-red-300 transition-colors cursor-pointer"
                                                disabled={editLoading}
                                                title="Delete"
                                                aria-label="Delete skill"
                                            >
                                                <Trash2 size={18} className="text-red-700" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex items-center justify-center gap-4 my-2">
                    <button
                        className={`cursor-pointer p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition ${page === 1 ? "cursor-not-allowed opacity-50" : ""}`}
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className={`cursor-pointer p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition ${page === totalPages ? "cursor-not-allowed opacity-50" : ""}`}
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        aria-label="Next page"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {editingIndex === null && !showAddInput && (
                    <div className="absolute bottom-6 right-6 z-20">
                        <button
                            type="button"
                            className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#ED5E20] text-white font-semibold shadow-lg hover:bg-[#d94e13] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400"
                            onClick={() => setShowAddInput(true)}
                            disabled={addLoading}
                            aria-label="Add skill"
                        >
                            <Plus size={22} />
                        </button>
                    </div>
                )}
                {showAddInput && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl p-6 w-full max-w-xs mx-4 flex flex-col gap-4">
                            <h3 className="text-lg font-semibold text-[#ED5E20] dark:text-orange-300 text-center">
                                Add a Skill
                            </h3>
                            <input
                                type="text"
                                value={newSkill}
                                onChange={e => setNewSkill(e.target.value)}
                                placeholder="Enter skill"
                                className="border rounded px-2 py-2 text-base"
                                disabled={addLoading}
                                autoFocus
                                onKeyDown={async (e) => {
                                    if (e.key === "Enter" && newSkill.trim()) {
                                        await handleAddSkill();
                                        setShowAddInput(false);
                                    }
                                }}
                            />
                            <div className="flex gap-2 justify-end">
                                {!addLoading && (
                                    <button
                                        onClick={async () => {
                                            await handleAddSkill();
                                            setShowAddInput(false);
                                        }}
                                        className="px-4 py-2 rounded bg-green-500 text-white font-semibold hover:bg-green-600 transition cursor-pointer"
                                        disabled={!newSkill.trim()}
                                    >
                                        Confirm
                                    </button>
                                )}
                                {addLoading && (
                                    <span className="flex items-center gap-2 px-4 py-2 text-green-700 font-semibold animate-pulse">
                                        <Loader2 size={20} className="animate-spin" />
                                        Adding skill...
                                    </span>
                                )}
                                {!addLoading && (
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition cursor-pointer"
                                        onClick={() => {
                                            setShowAddInput(false);
                                            setNewSkill("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSkillForm;