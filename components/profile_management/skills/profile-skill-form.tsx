import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type ProfileSkillFormProps = {
    skills: string[];
    profileId: string;
    onSave?: (skills: string[]) => void;
    onCancel?: () => void;
};

const ProfileSkillForm: React.FC<ProfileSkillFormProps> = ({
    skills: initialSkills,
    profileId,
    onSave,
    onCancel,
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

    const totalPages = Math.ceil(skills.length / ITEMS_PER_PAGE);

    const paginatedSkills = skills.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );
    const supabase = createClient();

    // Add Skill
    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;
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
                .insert({ profile_id: profileId, skill_id: skillId });

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

            setSkills([...skills, newSkill.trim()]);
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
                .eq("skill_id", skillRow.id);

            if (deleteError) throw deleteError;

            setSkills(skills.filter((_, i) => i !== index));
        } catch (err: any) {
            setError(err.message || "Error deleting skill");
        }
    };

    // Edit Skill
    const handleEditSkill = async (oldSkillName: string, newSkillName: string, index: number) => {
        setEditLoading(true);
        setError(null);

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

            if (updateError) throw updateError;

            const updatedSkills = [...skills];
            updatedSkills[index] = newSkillName;
            setSkills(updatedSkills);
        } catch (err: any) {
            setError(err.message || "Error updating skill");
        } finally {
            setEditLoading(false);
            setEditingIndex(null);
            setEditValue("");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl p-8 w-full max-w-lg mx-4">
                <h2 className="text-xl font-semibold mb-6 text-[#ED5E20] dark:text-orange-300 text-center">
                    Manage Skills & Tools
                </h2>
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
                                                className="px-3 py-1 bg-green-500 text-white rounded mr-2"
                                                disabled={editLoading || !editValue.trim()}
                                                title="Save"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => { setEditingIndex(null); setEditValue(""); }}
                                                className="px-3 py-1 bg-gray-300 text-gray-800 rounded"
                                                disabled={editLoading}
                                                title="Cancel"
                                            >
                                                Cancel
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
                        onClick={() => setPage(page - 1)}
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


                <div className="flex justify-between items-center mt-6">
                    {/* Add button or input flush left */}
                    <div>
                        <button
                            type="button"
                            className="flex items-center gap-1 px-4 py-2 rounded bg-[#ED5E20] text-white font-semibold hover:bg-[#d94e13] transition cursor-pointer"
                            onClick={() => setShowAddInput(true)}
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </div>
                    {/* Cancel and Save flush right */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-orange-400 text-white font-semibold hover:bg-orange-500 transition cursor-pointer"
                            onClick={() => onSave && onSave(skills)}
                        >
                            Save
                        </button>
                    </div>
                </div>

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
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </div>
        </div>
    );
};

export default ProfileSkillForm;