"use client";

import React, { useState } from "react";
import { Pencil } from "lucide-react";
import ProfileSkillForm from "./profile-skill-form";

type ProfileSkillsProps = {
    skills: string[];
    profileId: string;
    onAddSkill?: (skill: string) => void;
    onDeleteSkill?: (skill: string) => void;
    onEditSkill?: (oldSkill: string, newSkill: string) => void;
    isOwner?: boolean;
};

export default function ProfileSkills({
    skills,
    profileId,
    isOwner
}: ProfileSkillsProps) {
    const [showManage, setShowManage] = useState(false);
    const [localSkills, setLocalSkills] = useState<string[]>(skills);

    return (
        <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[#1A1A1A] dark:text-white">
                    Skills &amp; Tools
                </h2>
                {isOwner && (
                    <button
                        onClick={() => setShowManage(true)}
                        className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-300 transition-colors cursor-pointer"
                        title="Manage skills"
                        aria-label="Manage skills"
                    >
                        <Pencil size={18} className="text-yellow-700" />
                    </button>
                )}
            </div>

            {/* Skills list */}
            {localSkills.length > 0 ? (
                <ul className="flex flex-wrap gap-2 mb-4">
                    {localSkills.map((skill, i) => (
                        <li
                            key={i}
                            className="flex items-center gap-2 px-6 py-3 bg-[#ED5E20] text-white rounded-full text-sm transition"
                        >
                            <span>{skill}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">
                    No skills added yet.
                </p>
            )}

            {/* Manage modal */}
            {showManage && (
                <ProfileSkillForm
                    skills={localSkills}
                    profileId={profileId}
                    onSkillsChange={setLocalSkills}
                    onCancel={() => setShowManage(false)}
                />
            )}
        </div>
    );
}