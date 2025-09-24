// DesignCard.tsx
import { useState, useEffect } from "react";
import { useOnScreen } from "./countViews/view-counter";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { IconHeart, IconHeartFilled, IconEye } from "@tabler/icons-react";
import { SparkleEffect } from "./animation/heart-pop";
import { MessageSquare } from "lucide-react";


export type DesignInfo = {
    design_id: string;
    project_name: string;
    figma_link: string;
    likes: number;
    views: number;
    liked: boolean;
    thumbnail_url?: string;
};

type UserInfo = {
    user_id: string;
    name: string;
    user_avatar: string;
    designs: DesignInfo[];
};

export function DesignCard({
    design,
    user,
    currentUserId,
    animatingHeart,
    handleToggleLike,
    // fetchUsersWithDesigns,
}: {
    design: DesignInfo;
    user: UserInfo;
    currentUserId: string | null;
    animatingHeart: string | null;
    handleToggleLike: (
        currentUserId: string | null,
        ownerUserId: string,
        designId: string
    ) => void;
    fetchUsersWithDesigns: () => void;
}) {
    const [hasViewed, setHasViewed] = useState(false);
    const [commentCount, setCommentCount] = useState<number>(0);

    useEffect(() => {
        const fetchCommentCount = async () => {
            const supabase = createClient();
            const { count, error } = await supabase
                .from("comments") 
                .select("*", { count: "exact", head: true })
                .eq("design_id", design.design_id)
                .neq("user_id", user.user_id);

            if (error) {
                console.error(
                    "[CommentCounter] Error fetching comment count:",
                    { error, design_id: design.design_id, user_id: user.user_id }
                );
            } else {
                setCommentCount(count || 0);
            }
        };
        fetchCommentCount();
    }, [design.design_id, user.user_id]);

    // Use Intersection Observer to increment views when card is visible
    const viewRef = useOnScreen(async () => {
        if (!hasViewed) {
            setHasViewed(true);
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            // Prevent owner from incrementing their own view count
            if (userId === user.user_id) {
                return;
            }
            console.log("Design viewed:", design.design_id, design.project_name);
            const { error } = await supabase.rpc("increment_design_views", {
                p_design_id: design.design_id,
                p_user_id: userId,
            });
            if (error) {
                console.error("Supabase RPC error:", error);
            }
        }
    });

    return (
        <div
            ref={viewRef}
            className="bg-white dark:bg-[#1A1A1A] rounded-b-xl shadow-md space-y-0 flex flex-col h-full p-3"
            key={design.design_id}
        >
            <Link
                href={`designs/${design.design_id}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                <div className="relative w-full aspect-video rounded-lg border overflow-hidden">
                    <Image
                        src={design.thumbnail_url || "/images/design-thumbnail.png"}
                        alt="Design thumbnail"
                        fill
                        className="object-cover rounded-lg bg-accent/10 dark:bg-accent"
                    />
                </div>
            </Link>
            <div className="p-3 space-y-2 group relative">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="w-full text-lg truncate">
                        {design.project_name}
                    </h3>
                </div>
                <div className="text-sm text-gray-500 flex items-center justify-between">
                    <span className="relative flex items-center gap-2">
                        <button
                            onClick={() => handleToggleLike(currentUserId, user.user_id, design.design_id)}
                            disabled={user.user_id === currentUserId || animatingHeart === design.design_id}
                            className={`text-gray-500 hover:text-red-500 transition
                            ${user.user_id === currentUserId
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                            title={
                                user.user_id === currentUserId
                                    ? "You can't like your own design"
                                    : animatingHeart === design.design_id
                                        ? (design.liked ? "Unliking..." : "Liking...")
                                        : (design.liked ? "Unlike" : "Like")
                            }
                        >
                            {design.liked ? (
                                <IconHeartFilled
                                    size={20}
                                    className={`text-red-500 transition-transform duration-300
                                    ${animatingHeart === design.design_id ? "scale-125" : ""}
                                    ${user.user_id === currentUserId ? "opacity-50" : ""}`}
                                />
                            ) : (
                                <IconHeart
                                    size={20}
                                    className={`transition-transform duration-300
                                    ${animatingHeart === design.design_id ? "scale-125" : ""}
                                    ${user.user_id === currentUserId ? "opacity-50" : ""}`}
                                />
                            )}
                            <SparkleEffect show={animatingHeart === design.design_id} />
                        </button>
                        <span>{design.likes}</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                            <span
                                className="flex items-center p-2 rounded-full transition"
                                title="Comment on this design"
                                aria-label="Comment"
                            // Optionally, add onClick to open a comment/reply modal
                            // onClick={handleOpenComments}
                            >
                                <MessageSquare size={19} />
                            </span>
                            <span className="text-xs text-gray-500 font-semibold">
                                {commentCount}
                            </span>
                        </span>
                        {/* Views */}
                        <span className="flex items-center gap-2 ml-1">
                            <IconEye size={22} />
                            <span className="text-xs text-gray-500 font-semibold">{design.views}</span>
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}