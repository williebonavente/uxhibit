"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import DesignsGallery from "../designs-gallery";

type DesignsGalleryProps = {
    designs: any[];
    profileId: string;
    isOwnProfile?: boolean;
};

export default function ProfileDesigns({ profileUserId }: { profileUserId: string }) {
    const [designs, setDesigns] = useState<DesignsGalleryProps[]>([]);
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
                    setDesigns([
                        {
                            designs: data ?? [],
                            profileId: profileUserId,
                            isOwnProfile: true,
                        }
                    ]);
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

                    const mappedDesigns = [
                        {
                            designs: (data ?? []).map((item: any) =>
                                Array.isArray(item.designs) ? item.designs[0] : item.designs
                            ),
                            profileId: profileUserId,
                            isOwnProfile: false,
                        }
                    ];
                    setDesigns(mappedDesigns);
                }
            };
            fetchDesigns();
        });
    }, [profileUserId]);

    if (!designs) return <div>Loading...</div>;
    return (
        <DesignsGallery
            profileId={profileUserId}
            isOwnProfile={currentUserId === profileUserId}
        />
    );
}