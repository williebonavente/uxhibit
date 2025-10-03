"use client";
import { useEffect, useState } from "react";
import ProfileStatsGrid from "./profile-stats-grid";
import { LayoutGrid, Heart, Eye, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ProfileStatsGridContainer({ profileId }: { profileId: string }) {
    const [followers, setFollowers] = useState(0);

    useEffect(() => {
        async function fetchFollowers() {
            const supabase = createClient();
            const { count } = await supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("following_id", profileId);
            setFollowers(count || 0);
        }
        fetchFollowers();
    }, [profileId]);

    const stats = [
        { label: "Designs", value: 24, icon: <LayoutGrid size={25} className="text-white" /> },
        { label: "Likes", value: 1280, icon: <Heart size={25} className="text-white" /> },
        { label: "Views", value: "15.2K", icon: <Eye size={25} className="text-white" /> },
        { label: "Followers", value: followers, icon: <Users size={25} className="text-white" /> },
    ];

    return <ProfileStatsGrid stats={stats} />;
}