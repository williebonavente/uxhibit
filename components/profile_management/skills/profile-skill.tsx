"use client";

import React, { useState } from "react";
import { Pencil, Plus } from "lucide-react";
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
  isOwner,
  onAddSkill,
  onDeleteSkill,
  onEditSkill,
}: ProfileSkillsProps) {
  const [showManage, setShowManage] = useState(false);
  const [localSkills, setLocalSkills] = useState<string[]>(skills);

  const empty = localSkills.length === 0;

  return (
    <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md relative group break-words">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-white mb-3">Skills & Tools</h2>

        {isOwner && (
          <button
            onClick={() => setShowManage(true)}
            className="absolute top-5 right-5 p-2 cursor-pointer flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title={empty ? "Add Skills" : "Manage Skills"}
            aria-label={empty ? "Add Skills" : "Manage Skills"}
          >
            {empty ? <Plus size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white" /> : <Pencil size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white" />}
          </button>
        )}
      </div>

      {empty ? (
        <p className="italic text-gray-400 text-sm">Show off your skills!</p>
      ) : (
        <ul className="flex flex-wrap gap-2 mb-4">
          {localSkills.map((skill, i) => (
            <li
              key={i}
              className="flex items-center gap-2 px-5 py-3 bg-[#ED5E20]/20 dark:bg-[#ED5E20]/10 border border-[#ED5E20]/50 dark:border-[#ED5E20]/25 border-2 text-[#ED5E20] rounded-full text-sm font-semibold transition"
            >
              <span>{skill}</span>
            </li>
          ))}
        </ul>
      )}

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