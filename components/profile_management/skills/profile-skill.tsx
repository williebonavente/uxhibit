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
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[#1A1A1A] dark:text-white">Skills & Tools</h2>
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
            <ul className="flex flex-wrap gap-2 mb-4">
                {localSkills.map((skill, i) => (
                    <li
                        key={i}
                        className="flex items-center gap-2 px-6 py-3 bg-[#ED5E20] text-white rounded-full text-sm transition group"
                    >
                        <span>{skill}</span>
                    </li>
                ))}
            </ul>

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