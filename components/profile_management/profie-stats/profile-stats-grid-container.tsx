"use client";
import { useEffect, useState } from "react";
import ProfileStatsGrid from "./profile-stats-grid";
import { LayoutGrid, Heart, Eye, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function ProfileStatsGridContainer({ profileId }: { profileId: string }) {
    const [followers, setFollowers] = useState(0);
    const [views, setViews] = useState(0);
    const [hearts, setHearts] = useState(0);
    const [designs, setDesigns] = useState(0);


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

    useEffect(() => {
        async function fetchStats() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("published_designs")
                .select("num_of_views, num_of_hearts")
                .eq("user_id", profileId);

            if (error) {
                toast.error("Failed to fetch stats. Please try again.");
                return;
            }

            if (data) {
                // Sum up the values just like SQL SUM()
                const totalViews = data.reduce((sum, d) => sum + (d.num_of_views || 0), 0);
                const totalHearts = data.reduce((sum, d) => sum + (d.num_of_hearts || 0), 0);
                setViews(totalViews);
                setHearts(totalHearts);
            }
        }
        fetchStats();
    }, [profileId]);

    useEffect(() => {
        async function fetchDesignsCount() {
            const supabase = createClient();
            const [{ count: designsCount }, { count: caseStudiesCount }, { count: featuredWorksCount }] = await Promise.all([
                supabase.from("designs").select("*", { count: "exact", head: true }).eq("owner_id", profileId),
                supabase.from("case_studies").select("*", { count: "exact", head: true }).eq("user_id", profileId),
                supabase.from("featured_works").select("*", { count: "exact", head: true }).eq("user_id", profileId),
            ]);
            setDesigns((designsCount || 0) + (caseStudiesCount || 0) + (featuredWorksCount || 0));
        }
        fetchDesignsCount();
    }, [profileId]);


    const stats = [
        { label: "Designs", value: designs, icon: <LayoutGrid size={25} className="text-white" /> },
        { label: "Likes", value: hearts, icon: <Heart size={25} className="text-white" /> },
        { label: "Views", value: views, icon: <Eye size={25} className="text-white" /> },
        { label: `Follower${followers === 1 ? "" : "s"}`, value: followers, icon: <Users size={25} className="text-white" /> },
    ];

    return <ProfileStatsGrid stats={stats} />;
}