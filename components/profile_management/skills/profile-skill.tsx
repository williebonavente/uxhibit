"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type ProfileSkillsProps = {
    skills: string[];
    profileId: string;
    onAddSkill?: (skill: string) => void;
    onDeleteSkill?: (skill: string) => void;
    onEditSkill?: (oldSkill: string, newSkill: string) => void;
};

export default function ProfileSkills({
    skills,
    profileId,
    onAddSkill,
    onDeleteSkill,
    onEditSkill,
}: ProfileSkillsProps) {

    const [newSkill, setNewSkill] = useState("");
    const [addLoading, setAddLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [showAdd, setShowAdd] = useState(false);

    const supabase = createClient();

    // Add Skill
    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;
        setAddLoading(true);
        setError(null);

        try {
            // ...existing logic...
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
                // Check for duplicate key error
                if (
                    profileSkillError.message.includes("duplicate key") ||
                    profileSkillError.message.includes("unique constraint")
                ) {
                    // setError("You already have this skill.");
                    toast.error("This skill is already in place. Would you mind adding another skill?");
                    return;
                }
                throw profileSkillError;
            }

            if (onAddSkill) onAddSkill(newSkill.trim());
            setNewSkill("");
            setShowAdd(false);
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
    const handleDeleteSkill = async (skillName: string) => {
        setError(null);

        try {
            // 1. Get skill id
            const { data: skillRow } = await supabase
                .from("skills")
                .select("id")
                .eq("name", skillName)
                .single();

            if (!skillRow) throw new Error("Skill not found");

            // 2. Delete from profile_skills
            const { error: deleteError } = await supabase
                .from("profile_skills")
                .delete()
                .eq("profile_id", profileId)
                .eq("skill_id", skillRow.id);

            if (deleteError) throw deleteError;

            if (onDeleteSkill) onDeleteSkill(skillName);
        } catch (err: any) {
            setError(err.message || "Error deleting skill");
        } finally {
            // setLoading(false);
            // setAddLoading(false);
        }
    };

    // Edit Skill (simple version: update skill name)
    const handleEditSkill = async (oldSkillName: string, newSkillName: string) => {
        // setLoading(true);
        setEditLoading(true);
        setError(null);

        try {
            // 1. Get old skill id
            const { data: oldSkillRow } = await supabase
                .from("skills")
                .select("id")
                .eq("name", oldSkillName)
                .single();

            if (!oldSkillRow) throw new Error("Skill not found");

            // 2. Update skill name in skills table
            const { error: updateError } = await supabase
                .from("skills")
                .update({ name: newSkillName })
                .eq("id", oldSkillRow.id);

            if (updateError) throw updateError;

            if (onEditSkill) onEditSkill(oldSkillName, newSkillName);
        } catch (err: any) {
            setError(err.message || "Error updating skill");
        } finally {
            // setLoading(false);
            setEditLoading(false);
            setEditingIndex(null);
            setEditValue("");
        }
    };
    return (
        <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[#1A1A1A] dark:text-white">Skills & Tools</h2>
                <button
                    onClick={() => setShowAdd(true)}
                    className="p-2 rounded-full bg-green-100 hover:bg-green-300 dark:bg-green-900 dark:hover:bg-green-700 transition-colors cursor-pointer"
                    title="Add skill"
                    aria-label="Add skill"
                >
                    <Plus size={18} className="text-green-700 dark:text-green-300" />
                </button>
            </div>
            <ul className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill, i) => (
                    <li
                        key={i}
                        className="flex items-center gap-1 px-4 py-2 bg-[#ED5E20] text-white rounded-full text-xs transition group"
                    >
                        {editingIndex === i ? (
                            <>
                                <input
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="text-black dark:text-white bg-yellow-50 dark:bg-yellow-900 px-2 py-1 rounded border border-yellow-300 dark:border-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-24"
                                    disabled={editLoading}
                                />
                                <button
                                    onClick={() => handleEditSkill(skill, editValue)}
                                    className="ml-1 p-1.5 rounded-full bg-green-100 dark:bg-green-900 hover:bg-green-300 dark:hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                                    disabled={editLoading || !editValue.trim()}
                                    title="Save"
                                    aria-label="Save skill"
                                >
                                    {editLoading ? (
                                        <span className="text-green-800 dark:text-green-200 font-semibold">Saving...</span>
                                    ) : (
                                        <Check size={16} className="text-green-700" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingIndex(null);
                                        setEditValue("");
                                    }}
                                    className="ml-1 p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                                    disabled={editLoading}
                                    title="Cancel"
                                    aria-label="Cancel edit"
                                >
                                    <X size={16} className="text-gray-700 dark:text-gray-200" />
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="truncate max-w-[120px]">{skill}</span>
                                <button
                                    onClick={() => {
                                        setEditingIndex(i);
                                        setEditValue(skill);
                                    }}
                                    className="ml-1 p-1.5 rounded-full bg-yellow-100 hover:bg-yellow-300 transition-colors cursor-pointer disabled:opacity-50"
                                    disabled={editLoading}
                                    title="Edit"
                                    aria-label="Edit skill"
                                >
                                    <Pencil size={16} className="text-yellow-700" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm("Delete this skill?")) {
                                            handleDeleteSkill(skill);
                                        }
                                    }}
                                    className="ml-1 p-1.5 rounded-full bg-red-100 hover:bg-red-300 transition-colors cursor-pointer disabled:opacity-50"
                                    disabled={editLoading}
                                    title="Delete"
                                    aria-label="Delete skill"
                                >
                                    <Trash2 size={16} className="text-red-700" />
                                </button>
                            </>
                        )}
                    </li>
                ))}
            </ul>

            {showAdd && (
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        className="border rounded px-2 py-1 text-sm flex-1"
                        disabled={addLoading}
                        autoFocus
                    />
                    <button
                        onClick={handleAddSkill}
                        className={
                            addLoading
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-not-allowed"
                                : "bg-[#ED5E20] text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 hover:bg-[#d94e13] cursor-pointer transition"
                        }
                        disabled={addLoading}
                        aria-busy={addLoading}
                    >
                        {addLoading ? "Adding..." : "Add"}
                    </button>
                    {!addLoading && (
                        <button
                            onClick={() => { setShowAdd(false); setNewSkill(""); }}
                            className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Cancel"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}