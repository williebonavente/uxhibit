"use client";
import { useState, useEffect } from "react";
import ProfileSkills from "./profile-skill";
import { createClient } from "@/utils/supabase/client";

type ProfileSkillsSectionProps = {
    initialSkills: string[];
    profileId: string;
    
};



export default function ProfileSkillsSection({ initialSkills, profileId }: ProfileSkillsSectionProps) {
    const [skills, setSkills] = useState(initialSkills);
    const [isOwner, setIsOwner]= useState(false);

    const handleAddSkill = (skill: string) => setSkills([...skills, skill]);
    const handleDeleteSkill = (skill: string) => setSkills(prev => prev.filter(s => s !== skill));
    const handleEditSkill = (oldSkill: string, newSkill: string) =>
        setSkills(prev => prev.map(s => (s === oldSkill ? newSkill : s)));

    const supabase = createClient();
    useEffect(() => {
    async function checkOwner() {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: profileDetails } = await supabase
        .from("profile_details")
        .select("profile_id")
        .eq("profile_id", profileId)
        .single();

      const ownerCheck = Boolean(user && profileDetails && user.id === profileDetails.profile_id);
      setIsOwner(ownerCheck);

    }
    checkOwner();
  }, [profileId, supabase]);

    return <ProfileSkills
        skills={skills}
        profileId={profileId}
        onAddSkill={handleAddSkill}
        onDeleteSkill={handleDeleteSkill}
        onEditSkill={handleEditSkill}
        isOwner={isOwner}
    />;
}