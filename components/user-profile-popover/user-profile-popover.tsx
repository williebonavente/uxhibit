import Image from "next/image";
import Link from "next/link";
import * as HoverCard from "@radix-ui/react-hover-card";
import { Button } from "../ui/button";
import { Loader2, User as UserIcon, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export type UserInfo = {
    user_id: string;
    name: string;
    user_avatar: string;
    role?: string;
    bio?: string;
    website?: string;
};

export function UserProfilePopover({ user }: { user: UserInfo }) {

    const [isLoading, setIsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    async function handleFollow() {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const currentUserId = currentUser?.id;
            if (!currentUserId) {
                throw new Error("You must be logged in to follow users.");
            }
            const { error } = await supabase.from("follows").insert([
                {
                    follower_id: currentUserId,
                    following_id: user.user_id,
                },
            ]);
            if (error) {
                throw error;
            }
            toast.success(`You are now following ${user.name}!`);
            setIsFollowing(true);
        } catch (error) {
            console.error("Failed to follow user:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUnfollow() {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const currentUserId = currentUser?.id;
            if (!currentUserId) {
                throw new Error("You must be logged in to unfollow users.");
            }
            const { error } = await supabase
                .from("follows")
                .delete()
                .eq("follower_id", currentUserId)
                .eq("following_id", user.user_id);
            if (error) throw error;
            toast.success(`You have unfollowed ${user.name}.`);
            setIsFollowing(false);
        } catch (error) {
            toast.error("Failed to unfollow user.");
            console.error("Failed to unfollow user:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        async function checkFollowing() {
            const supabase = createClient();
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const currentUserId = currentUser?.id;
            if (!currentUserId) return;
            const { data } = await supabase
                .from("follows")
                .select("id")
                .eq("follower_id", currentUserId)
                .eq("following_id", user.user_id)
                .maybeSingle();
            if (data) setIsFollowing(true);
        }
        checkFollowing();
    }, [user.user_id]);

    useEffect(() => {
        async function fetchCurrentUser() {
            const supabase = createClient();
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setCurrentUserId(currentUser?.id ?? null);
        }
        fetchCurrentUser();
    }, []);

    const isOwnProfile = currentUserId === user.user_id;

    return (
        <HoverCard.Root>
            <HoverCard.Trigger asChild>
                <Link
                    href={`/profile-user/${user.user_id}`}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Image
                        src={user.user_avatar || "/default-avatar.png"}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-white shadow"
                        width={40}
                        height={40}
                    />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {user.name}
                    </span>
                </Link>
            </HoverCard.Trigger>
            <HoverCard.Portal>
                <HoverCard.Content
                    className="rounded-xl shadow-xl bg-white dark:bg-neutral-900 p-6 w-80 border border-gray-100 dark:border-neutral-800"
                    sideOffset={5}
                >
                    {/* Header: Avatar + Name + Role */}
                    <div className="flex items-start gap-4 mb-4">
                        <div className="relative flex-shrink-0 mt-1">
                            <Image
                                src={user.user_avatar || "/default-avatar.png"}
                                alt={user.name}
                                className="w-16 h-16 rounded-full border-2 border-white shadow"
                                width={64}
                                height={64}
                            />
                            <span className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-900 rounded-full p-1 shadow flex items-center justify-center border border-gray-200 dark:border-neutral-800">
                                <UserIcon size={18} className="text-[#ED5E20]" />
                            </span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                {user.name}
                            </span>
                            {user.role && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    <span className="font-semibold">Role:</span> {user.role}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bio and Website */}
                    <div className="flex flex-col gap-3 mb-5">
                        {user.bio && (
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">Bio:</span>{" "}
                                <span className="block mt-0.5">{user.bio}</span>
                            </div>
                        )}
                        {user.website && (
                            <div className="text-sm break-all">
                                <Link
                                    href={user.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {user.website.replace(/(^\w+:|^)\/\//, "").replace(/^www\./, "")}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Follow Button */}
                    {!isOwnProfile && (
                        <Button
                            className={`cursor-pointer w-full font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2
                    ${isFollowing ? "bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600" : "bg-[#ED5E20] hover:bg-[#d44e0f] text-white"}
                `}
                            onClick={isFollowing ? handleUnfollow : handleFollow}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin w-4 h-4" />
                                    {isFollowing ? "Unfollowing..." : "Following..."}
                                </>
                            ) : isFollowing ? (
                                <>
                                    <UserMinus className="w-4 h-4" />
                                    Following
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Follow
                                </>
                            )}
                        </Button>
                    )}
                </HoverCard.Content>
            </HoverCard.Portal>
        </HoverCard.Root>
    );
}
