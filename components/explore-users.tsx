"use client";

import {
  useState,
  useEffect,
  useCallback
} from "react";
import {
  IconEye,
  IconHeart,
  IconSearch,
} from "@tabler/icons-react";
import Image from "next/image";

import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { LoadingInspiration } from "./animation/loading-fetching";
import { DesignCard } from "./design-card";
import { Comment } from "./comments-user";
import { UserProfilePopover } from "./user-profile-popover/user-profile-popover";


type DesignInfo = {
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
  role?: string;
  bio?: string;
  website?: string;
  designs: DesignInfo[];
};

type UserAvatarProps = {
  avatarPath: string | null;
  alt: string;
  className?: string;
}


export const UserAvatar: React.FC<UserAvatarProps> = ({ avatarPath, alt, className }) => (
  <Image
    src={avatarPath || "/iamges/default_avatar.png"}
    alt={alt}
    className={`rounded-full ${className ?? ""}`}
    width={40}
    height={40}
  />
);

export function useSignedAvatarUrl(avatarPath: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarPath) {
      setSignedUrl(null);
      return;
    }
    // If it's already a full URL, use it directly
    if (avatarPath.startsWith("http")) {
      setSignedUrl(avatarPath);
      return;
    }
    const supabase = createClient();

    const fetchUrl = async () => {
      const { data } = await supabase
        .storage
        .from("avatars")
        .createSignedUrl(avatarPath, 60 * 60); // 1 hour
      setSignedUrl(data?.signedUrl || null);
    };

    fetchUrl();

    const interval = setInterval(fetchUrl, 55 * 60 * 1000);

    return () => clearInterval(interval);
  }, [avatarPath]);

  return signedUrl;
}
export default function ExplorePage() {

  const initialComments: Comment[] = [];
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingHeart, setAnimatingHeart] = useState<string | null>(null);
  // debounce state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState("");
  const [currentUserProfile, setCurrentUserProfile] = useState<{ fullName: string; avatarUrl: string } | null>(null);

    const fetchUsersWithDesigns = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      // Fetch users (with bio)
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, first_name, middle_name, last_name, avatar_url, bio");
  
      if (usersError) {
        setLoading(false);
        return;
      }
  
      // Fetch roles from profile_details
      const { data: detailsData } = await supabase
        .from("profile_details")
        .select("id, profile_id, role"); // <-- include id
  
      // Fetch websites from profile_contacts
      const { data: contactsData } = await supabase
        .from("profile_contacts")
        .select("profile_details_id, website");
  
      // Fetch designs
      const { data: designsData, error: designsError } = await supabase
        .from("designs")
        .select("id, owner_id, title, figma_link, thumbnail_url, created_at");
  
      if (designsError) {
        setLoading(false);
        return;
      }
  
      // Fetch published designs
      const { data: publishedData, error: publishedError } = await supabase
        .from("published_designs")
        .select(`design_id, user_id, num_of_hearts, num_of_views, published_at,  
              designs (id, owner_id, title, figma_link, thumbnail_url, created_at), 
              profiles (id, first_name, middle_name, last_name, avatar_url)`)
        .eq("is_active", true);
  
      if (publishedError) {
        setLoading(false);
        return;
      }
  
      const publishedLookup = Object.fromEntries(
        (publishedData || []).map((p) => [p.design_id, p])
      );
  
      let likedDesignIds: string[] = [];
      if (currentUserId) {
        const { data: likesData } = await supabase
          .from("design_likes")
          .select("design_id")
          .eq("user_id", currentUserId);
        likedDesignIds = (likesData || []).map(like => like.design_id);
      }
  
      // Build lookup maps for details and contacts
      const detailsIdMap = Object.fromEntries((detailsData || []).map(d => [d.profile_id, d.id])); // profile_id (uuid) -> details.id (int)
      const detailsRoleMap = Object.fromEntries((detailsData || []).map(d => [d.profile_id, d.role]));
      const contactsMap = Object.fromEntries((contactsData || []).map(c => [c.profile_details_id, c.website]));
  
      const usersWithDesigns = usersData.map((user) => {
        const detailsId = detailsIdMap[user.id]; // get profile_details.id for this user
        const website = detailsId ? contactsMap[detailsId] : undefined;
        const role = detailsRoleMap[user.id] || undefined;
        const bio = user.bio || undefined;
  
        return {
          user_id: user.id,
          name: [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" "),
          user_avatar: user.avatar_url,
          role,
          bio,
          website,
          designs: (designsData || [])
            .filter((d) =>
              d.owner_id === user.id && publishedLookup[d.id]
            )
            .map((d) => {
              const published = publishedLookup[d.id];
              return {
                design_id: d.id,
                project_name: d.title,
                figma_link: d.figma_link,
                likes: published?.num_of_hearts ?? 0,
                views: published?.num_of_views ?? 0,
                liked: likedDesignIds.includes(d.id),
                thumbnail_url: d.thumbnail_url,
                isPublished: !!published,
                created_at: published?.published_at || d.created_at,
              };
            }),
        };
      });
  
      setUsers(usersWithDesigns);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const handleToggleLike = async (
    currentUserId: string | null,
    ownerUserId: string,
    designId: string
  ) => {
    setAnimatingHeart(designId); // Start animation
    setTimeout(() => setAnimatingHeart(null), 1000)

    if (!currentUserId) return;

    // Find the design in the owner's card
    const user = users.find((u) => u.user_id === ownerUserId);
    const design = user?.designs.find((d) => d.design_id === designId);
    const wasLiked = design?.liked ?? false;

    // Optimistically update UI
    const updatedUsers = users.map((user) => {
      if (user.user_id !== ownerUserId) return user;
      return {
        ...user,
        designs: user.designs.map((design) =>
          design.design_id === designId
            ? {
              ...design,
              liked: !design.liked,
              likes: design.liked ? design.likes - 1 : design.likes + 1,
            }
            : design
        ),
      };
    });
    setUsers(updatedUsers);

    const supabase = createClient();
    let error;

    if (wasLiked) {
      // Unlike (delete from design_likes)
      const { error: delError } = await supabase
        .from("design_likes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("design_id", designId);
      error = delError;
    } else {
      // Like (insert into design_likes)
      const { error: insError } = await supabase
        .from("design_likes")
        .insert([{ user_id: currentUserId, design_id: designId }]);
      error = insError;
      if (error && error.code === "23505") {
        setUsers(users); // revert to previous state
        toast.error("Please wait a moment...");
        return;
      }
    }

    // Always update the heart count in published_designs
    const { count } = await supabase
      .from("design_likes")
      .select("*", { count: "exact", head: true })
      .eq("design_id", designId);

    await supabase
      .from("published_designs")
      .update({ num_of_hearts: count ?? 0 })
      .eq("design_id", designId);

    if (error) {
      setUsers(users); // revert to previous state
      toast.error("Failed to update like!");
    }
  };

  // Debounce state
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchUsersWithDesigns();
  }, [fetchUsersWithDesigns, currentUserId]);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("first_name, middle_name, last_name, avatar_url")
        .eq("id", currentUserId)
        .single();
      if (data) {
        setCurrentUserProfile({
          fullName: [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(" "),
          avatarUrl: data.avatar_url,
        });
      }
    };
    fetchProfile();
  }, [currentUserId]);

  useEffect(() => {
    const fetchComments = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .select("id, text, user_id, created_at, local_time, parent_id")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Supabase error:", error);

        toast.error("Failed to fetch comments!");
        return;
      }

      const commentsWithUser = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: userData } = await supabase
            .from("profiles")
            .select("first_name, middle_name, last_name, avatar_url")
            .eq("id", comment.user_id)
            .single();
          return {
            id: comment.id,
            text: comment.text,
            user: {
              id: comment.user_id,
              fullName: [userData?.first_name, userData?.middle_name, userData?.last_name]
                .filter(Boolean)
                .join(" ") || "",
              avatarUrl: userData?.avatar_url || "",
            },
            replies: [],
            parentId: comment.parent_id,
            createdAt: new Date(comment.created_at),
            localTime: comment.local_time,
          };
        })
      );

      // Build a map for quick lookup
      const commentMap: { [id: string]: any } = {};
      commentsWithUser.forEach(comment => {
        commentMap[comment.id] = { ...comment, replies: [] };
      });

      // Build the tree
      const rootComments: any[] = [];
      commentsWithUser.forEach(comment => {
        if (comment.parentId) {
          // This is a reply, add to its parent
          if (commentMap[comment.parentId]) {
            commentMap[comment.parentId].replies.push(commentMap[comment.id]);
          }
        } else {
          // Top-level comment
          rootComments.push(commentMap[comment.id]);
        }
      });
      setComments(rootComments);
    };

    fetchComments();

    const supabase = createClient()
    const channel = supabase
      .channel('comments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          fetchComments();
          console.log("Payload information", payload)
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredUsers = users
    .map((user) => ({
      ...user,
      designs: user.designs.filter(
        (design) =>
          user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          design.project_name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    }))
    .filter((user) => user.designs.length > 0);

  if (loading) {
    return <LoadingInspiration />
  }
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#1A1A1A] backdrop-blur-md rounded-xl shadow px-4 py-2 flex items-center gap-3 w-full mx-auto">
        <IconSearch size={20} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search creators or projects..."
          className="w-full h-14 px-4 rounded-lg bg-accent/10 dark:bg-neutral-800/60 text-sm focus:outline-none focus:ring-1 focus:ring-[#ED5E20]/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>


      {/* Feed */}
      <div className="flex flex-col items-center space-y-8">
        {filteredUsers.flatMap((user) =>
          user.designs.map((design) => (
            <div
              key={design.design_id}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md overflow-hidden w-full"
            >
              {/* Post Header */}
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1A1A1A]">
                <UserProfilePopover user={user} />
              </div>

              {/* Design Card */}
              <DesignCard
                design={design}
                user={user}
                currentUserId={currentUserId}
                animatingHeart={animatingHeart}
                handleToggleLike={handleToggleLike}
                fetchUsersWithDesigns={fetchUsersWithDesigns}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
