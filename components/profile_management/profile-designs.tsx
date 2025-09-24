"use client";
import { useCallback, useEffect, useState } from "react";
// import DesignsGallery from "../designs-gallery";
import { createClient } from "@/utils/supabase/client";
import DesignsGallery from "../designs-gallery";


export default function ProfileDesigns({ profileUserId }: { profileUserId: string }) {
    const [designs, setDesigns] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUserId(user?.id ?? null);

            const fetchDesigns = async () => {
                if (user?.id === profileUserId) {
                    const { data } = await supabase
                        .from("designs")
                        .select("*")
                        .eq("owner_id", profileUserId);
                    setDesigns(data ?? []);
                } else {
                    const { data } = await supabase
                        .from("published_designs")
                        .select(`
                            design_id,
                            num_of_hearts,
                            is_active,
                            designs (
                                id,
                                owner_id,
                                title,
                                figma_link,
                                thumbnail_url
                            )
                        `)
                        .eq("user_id", profileUserId)
                        .eq("is_active", true);
                    setDesigns(data ?? []);
                }
            };
            fetchDesigns();
        });
    }, [profileUserId]);

    if (!designs) return <div>Loading...</div>;

    return (
        <DesignsGallery designs={designs} />

    );
}