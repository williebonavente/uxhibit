"use client";

import {
  useState,
  useEffect,
  useCallback
} from "react";
import { IconSearch } from "@tabler/icons-react";
import Image from "next/image";

import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { LoadingInspiration } from "./animation/loading-fetching";
import { DesignCard } from "./design-card";
import { randomBytes, createCipheriv } from 'crypto';
import { UserProfilePopover } from "./user-profile-popover/user-profile-popover";


type DesignInfo = {
  design_id: string;
  project_name: string;
  figma_link: string;
  likes: number;
  views: number;
  liked: boolean;
  thumbnail_url?: string;
  created_at: string;
};

export type UserInfo = {
  user_id: string;
  name: string;
  user_avatar: string;
  role?: string;
  bio?: string;
  website?: string;
  designs: DesignInfo[];
};

export type UserAvatarProps = {
  avatarPath: string | null;
  alt: string;
  className?: string;
}
export const UserAvatar: React.FC<UserAvatarProps> = ({ avatarPath, alt, className }) => (
  <Image
    src={avatarPath || "/images/default_avatar.png"}
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

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingHeart, setAnimatingHeart] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
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
        .select("id, profile_id, role");

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
        .eq("is_active", true)
        .order("published_at", { ascending: false });

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
          user_avatar: user.avatar_url || "/images/default_avatar.png",
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
            })
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
    setAnimatingHeart(designId);
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

  function useCurrentUserProfile(profile: { fullName: string; avatarUrl: string } | null) {
    const algorithm = 'aes-256-cbc';
    const key = randomBytes(32); // 32 bytes for AES-256
    const iv = randomBytes(16);  // 16 bytes for CBC mode

    function encrypt(text: string): string {
      const cipher = createCipheriv(algorithm, key, iv);
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      return encrypted.toString('hex');
    }

    if (profile) {
      const json = JSON.stringify(profile);
      const encryptedProfile = encrypt(json);
      console.log('Profile of the user: ', encryptedProfile);
    } else {
      console.log('No profile data to encrypt.');
    }
  }

  useCurrentUserProfile(currentUserProfile);
  if (loading) {
    return <LoadingInspiration />
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="sticky top-0 bg-white/80 dark:bg-[#1A1A1A] backdrop-blur-md rounded-xl shadow px-4 py-2 flex items-center gap-3 w-full mx-auto">
        <IconSearch size={20} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search creators or projects..."
          className="w-full h-14 px-4 rounded-lg bg-accent/10 dark:bg-neutral-800/60 text-sm focus:outline-none focus:ring-1 focus:ring-[#ED5E20]/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col items-center space-y-8">
        {filteredUsers.flatMap((user) =>
          [...user.designs]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((design) => (
              <div
                key={design.design_id}
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md overflow-hidden w-full"
              >
                {/* Post Header */}
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1A1A1A]">
                  <UserProfilePopover user={user || "/images/default_avatar.png"} />
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
