"use client";
import { useState } from "react";
import ProfileSkills from "./profile-skill";

type ProfileSkillsSectionProps = {
    initialSkills: string[];
    profileId: string;
};

export default function ProfileSkillsSection({ initialSkills, profileId }: ProfileSkillsSectionProps) {
    const [skills, setSkills] = useState(initialSkills);

    const handleAddSkill = (skill: string) => setSkills([...skills, skill]);
    const handleDeleteSkill = (skill: string) => setSkills(prev => prev.filter(s => s !== skill));
    const handleEditSkill = (oldSkill: string, newSkill: string) =>
        setSkills(prev => prev.map(s => (s === oldSkill ? newSkill : s)));

    return <ProfileSkills
        skills={skills}
        profileId={profileId}
        onAddSkill={handleAddSkill}
        onDeleteSkill={handleDeleteSkill}
        onEditSkill={handleEditSkill}
    />;
}