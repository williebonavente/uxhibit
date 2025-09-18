"use client";

import {
  useState,
  useEffect,
  useCallback
} from "react";
import {
  IconSearch,
} from "@tabler/icons-react";
import Image from "next/image";

import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { LoadingInspiration } from "./animation/loading-fetching";
import { DesignCard } from "./design-card";
import { Comment } from "./comments-user";


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
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url");

      console.log("Fetched usersData:", usersData);
      if (usersError) {
        console.error("Users fetch error:", usersError);
        setLoading(false);
        return;
      }
      // Fetch designs
      const { data: designsData, error: designsError } = await supabase
        .from("designs")
        .select("id, owner_id, title, figma_link, thumbnail_url");

      console.log("Fetched designsData:", designsData);
      if (designsError) {
        console.error("Designs fetch error:", designsError);
        setLoading(false);
        return;
      }

      const { data: publishedData, error: publishedError } = await supabase
        .from("published_designs")
        .select(` design_id, user_id, num_of_hearts, num_of_views,
                designs (id, owner_id, title, figma_link, thumbnail_url),
                profiles (id, full_name, avatar_url)`)
        .eq("is_active", true);

      if (publishedError) {
        setLoading(false);
        return;
      }
      const publishedDesignIds = publishedData?.map((p) => p.design_id) || [];

      const publishedLookup = Object.fromEntries(
        (publishedData || []).map((p) => [p.design_id, p])
      )
      console.log("Published designs:", publishedDesignIds);

      let likedDesignIds: string[] = [];
      if (currentUserId) {
        const { data: likesData } = await supabase
          .from("design_likes")
          .select("design_id")
          .eq("user_id", currentUserId);
        likedDesignIds = (likesData || []).map(like => like.design_id);
      }

      const usersWithDesigns = usersData.map((user) => ({
        user_id: user.id,
        name: user.full_name,
        user_avatar: user.avatar_url,
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
            };
          }),
      }));
      console.log("usersWithDesigns:", usersWithDesigns);

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
        .select("full_name, avatar_url")
        .eq("id", currentUserId)
        .single();
      if (data) {
        setCurrentUserProfile({
          fullName: data.full_name,
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
            .select("full_name, avatar_url")
            .eq("id", comment.user_id)
            .single();
          return {
            id: comment.id,
            text: comment.text,
            user: {
              id: comment.user_id,
              fullName: userData?.full_name || "",
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
    <div className="p-t-10 space-y-5">
      {/* Search */}
     <div className="flex items-center border rounded-lg px-4 py-2 w-full max-w-md mx-auto">
        <IconSearch size={20} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search users..."
          className="ml-3 w-full focus:outline-none bg-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* User Cards */}
      {filteredUsers.map((user) => (
        <div key={user.user_id} className="border rounded-xl shadow p-5 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <UserAvatar avatarPath={user.user_avatar} alt={user.name} />
            <h2 className="text-lg font-medium">{user.name}</h2>
          </div>

          {/* User Designs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {user.designs.map((design) => (
              <DesignCard
                key={design.design_id}
                design={design}
                user={user}
                currentUserId={currentUserId}
                animatingHeart={animatingHeart}
                handleToggleLike={handleToggleLike}
                fetchUsersWithDesigns={fetchUsersWithDesigns}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
