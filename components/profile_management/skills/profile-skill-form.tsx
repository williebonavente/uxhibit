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
        if (!newSkill.trim()) return false;

        const normalizedNewSkill = newSkill.trim().toLowerCase();
        const skillExists = skills.some(s => s.trim().toLowerCase() === normalizedNewSkill);
        if (skillExists) {
            toast.error("This skill is already in place. Would you mind adding another skill?");
            setAddLoading(false);
            return false;
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
                    return false;
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

            // keep input section open
            setNewSkill("");
            setShowAddInput(true);
            return true;
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || "Error adding skill");
            } else {
                setError("Unknown error adding skill");
            }
            return false;
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!profileId) {
            console.error("profileId is missing!");
            return;
        }

        try {
            // Save all current skills to the profile_details table
            const skillsArray = skills.map((s) => s.trim());

            const { error } = await supabase
                .from("profile_details")
                .update({ skills: skillsArray })
                .eq("id", profileId);

            if (error) {
                console.error("Failed to save skills:", error);
                toast.error("Failed to save skills. Please try again.");
                return;
            }

            toast.success("Skills saved successfully!");
            if (onSkillsChange) onSkillsChange(skills);
            if (onCancel) onCancel();
        } catch (err: unknown) {
            console.error("Error saving skills:", err);
            toast.error("Error saving skills. Please try again.");
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={onCancel}
        >
            <div
                className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-xl 
                 p-6 sm:p-8 md:p-10 bg-white dark:bg-[#1A1A1A] 
                 rounded-2xl shadow-xl border border-white/20 cursor-default"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-6">
                    Manage Skills / Tools
                </h2>

                {/* Skills Table (scrollable instead of pagination) */}
                <div className="overflow-y-auto max-h-64 mb-3 rounded-xl">
                    <table className="w-full text-sm sm:text-base border-separate border-spacing-y-3 pr-3">
                        <tbody>
                            {skills.map((skill, i) => (
                                <tr
                                    key={i}
                                    className="bg-gray-50 dark:bg-accent rounded-xl transition"
                                >
                                    <td className="pl-3 pr-3 py-2 rounded-xl">
                                        {/* Each row is its own group */}
                                        <div className="flex items-center justify-between group">
                                            {editingIndex === i ? (
                                                <input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#ED5E20]/60 focus:border-[#ED5E20]"
                                                    disabled={editLoading}

                                                />
                                            ) : (
                                                <span className="font-medium">{skill}</span>
                                            )}

                                            {/* Only show buttons when THIS row is hovered */}
                                            <div className="ml-3 flex items-center">
                                                {editingIndex === i ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditSkill(skill, editValue, i)}
                                                            className="p-2"
                                                            disabled={editLoading || !editValue.trim()}
                                                            title="Save"
                                                            aria-label="Save"
                                                        >
                                                            <Check size={18} className="text-gray-500 hover:text-green-400 cursor-pointer" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingIndex(null);
                                                                setEditValue("");
                                                            }}
                                                            className="p-2"
                                                            disabled={editLoading}
                                                            title="Cancel"
                                                            aria-label="Cancel"
                                                        >
                                                            <X size={18} className="text-gray-500 hover:text-red-400 cursor-pointer" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditingIndex(i);
                                                                setEditValue(skill);
                                                            }}
                                                            className="p-2"
                                                            disabled={editLoading}
                                                            title="Edit"
                                                            aria-label="Edit skill"
                                                        >
                                                            <Pencil
                                                                size={18}
                                                                className="text-gray-500 hover:text-orange-500 cursor-pointer"
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSkill(skill, i)}
                                                            className="p-2"
                                                            disabled={editLoading}
                                                            title="Delete"
                                                            aria-label="Delete skill"
                                                        >
                                                            <Trash2
                                                                size={18}
                                                                className="text-gray-500 hover:text-red-700 cursor-pointer"
                                                            />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add Skill Section */}
                {showAddInput ? (
                    <div className="mt-5 p-5 rounded-2xl border border-accent 
                                    bg-white dark:bg-[#1A1A1A]  shadow-md">
                        <label className="block text-md font-medium text-gray-600 dark:text-gray-300 mt-1 mb-3">
                            Add a new skill or tool
                        </label>
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="e.g., UI/UX, Figma, Photoshop..."
                            className="border border-accent rounded-xl px-4 py-2.5 w-full
                                        text-base bg-gray-50 dark:bg-neutral-800 
                                        focus:outline-none focus:ring-1 focus:ring-[#ED5E20]/60 focus:border-[#ED5E20]
                                        placeholder-gray-400 dark:placeholder-gray-500
                                        mb-4 transition"
                            disabled={addLoading}
                            onKeyDown={async (e) => {
                                if (e.key === "Enter" && newSkill.trim()) {
                                    await handleAddSkill();
                                }
                            }}
                        />

                        <div className="flex gap-3 justify-end">
                            {/* Cancel */}
                            <button
                                type="button"
                                className="px-5 py-2.5 rounded-xl text-sm font-medium
                                            border border-neutral-300/70 dark:border-neutral-600/60 
                                            bg-white/70 dark:bg-neutral-800/70
                                            text-neutral-700 dark:text-neutral-200
                                            shadow-sm backdrop-blur
                                            hover:bg-neutral-100 dark:hover:bg-neutral-700
                                            transition-colors cursor-pointer"
                                onClick={() => {
                                    setShowAddInput(false);
                                    setNewSkill("");
                                }}
                                disabled={addLoading}
                            >
                                Cancel
                            </button>

                            {/* Add */}
                            <button
                                onClick={async () => {
                                    await handleAddSkill();
                                }}
                                className="relative inline-flex items-center justify-center
                                            px-6 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                                            transition-all duration-300 cursor-pointer overflow-hidden
                                            focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                                            disabled:opacity-50 disabled:cursor-not-allowed group"
                                disabled={!newSkill.trim()}
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
                                <span className="relative z-10">{addLoading ? "Adding..." : "+ Add"}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-4 mt-6">
                        {/* Cancel */}
                        <button
                            onClick={onCancel}
                            aria-label="Close"
                            disabled={addLoading || editLoading}
                            className="flex-1 inline-flex items-center justify-center rounded-xl text-sm font-medium
                                        border border-neutral-300/70 dark:border-neutral-600/60
                                        bg-white/70 dark:bg-neutral-800/70
                                        text-neutral-700 dark:text-neutral-200
                                        shadow-sm backdrop-blur
                                        hover:bg-neutral-100 dark:hover:bg-neutral-700
                                        transition-colors h-12 cursor-pointer"
                        >
                            Cancel
                        </button>

                        {/* Add New Skill Button */}
                        <button
                            onClick={() => setShowAddInput(true)}
                            disabled={addLoading}
                            className="relative flex-1 inline-flex items-center justify-center
                                        rounded-xl text-sm text-white font-semibold tracking-wide
                                        transition-all duration-300 h-12 overflow-hidden
                                        focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 
                                        cursor-pointer group"
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
                            <span className="relative z-10">+ Add Skill</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSkillForm;