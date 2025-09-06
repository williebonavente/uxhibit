"use client";

import { useState, useEffect } from "react";
import {
  IconSearch,
  IconHeart,
  IconHeartFilled,
  IconEye,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/utils/supabase/client";
// import { retrieveFileOutToJSON } from "@mistralai/mistralai/models/components";

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


export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  function useSignedAvatarUrl(avatarPath: string | null) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);

    useEffect(() => {
      if (!avatarPath) {
        setSignedUrl(null);
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

      // Refresh every 55 minutes
      const interval = setInterval(fetchUrl, 55 * 60 * 1000);

      return () => clearInterval(interval);
    }, [avatarPath]);

    return signedUrl;
  }

  useEffect(() => {
    const fetchUsersWithDesigns = async () => {
      setLoading(true);
      const supabase = createClient();

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
        .select("id, owner_id, title, figma_link, thumbnail_url, num_of_hearts, num_of_views");

      console.log("Fetched designsData:", designsData);
      if (designsError) {
        console.error("Designs fetch error:", designsError);
        setLoading(false);
        return;
      }

      // Fetch published designs (get design_id and owner_id)
      const { data: publishedData, error: publishedError } = await supabase
        .from("published_designs")
        .select("design_id, user_id")
        .eq("is_active", true);

      if (publishedError) {
        setLoading(false);
        return;
      }

      // Only include published designs (if you want)
      const publishedDesignIds = publishedData?.map((p) => p.design_id) || [];
      console.log("Published designs:", publishedDesignIds);

      // Group designs by user
      const usersWithDesigns = usersData.map((user) => ({
        user_id: user.id,
        name: user.full_name,
        user_avatar: user.avatar_url,
        designs: (designsData || [])
          .filter((d) => d.owner_id === user.id)
          .map((d) => ({
            design_id: d.id,
            project_name: d.title,
            figma_link: d.figma_link,
            likes: d.num_of_hearts,
            views: d.num_of_views,
            liked: false,
            thumbnail_url: d.thumbnail_url,
          })),
      }));
      console.log("usersWithDesigns:", usersWithDesigns);

      setUsers(usersWithDesigns);
      setLoading(false);
    };

    fetchUsersWithDesigns();
  }, []);


  function UserAvatar({ avatarPath, alt }: { avatarPath: string | null, alt: string }) {
    const avatarUrl = useSignedAvatarUrl(avatarPath);
    return (
      <Image
        src={avatarUrl ?? "/images/default-avatar.png"}
        alt={alt}
        className="w-10 h-10 rounded-full"
        width={400}
        height={400}
      />
    );
  }

  const handleToggleLike = (userId: string, designId: string) => {
    const updatedUsers = users.map((user) => {
      if (user.user_id !== userId) return user;
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
  };

  const filteredUsers = users
    .map((user) => ({
      ...user,
      designs: user.designs.filter(
        (design) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          design.project_name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((user) => user.designs.length > 0);

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
              <div
                key={design.design_id}
                className="bg-accent dark:bg-[#1A1A1A] rounded-xl shadow-md space-y-0 flex flex-col h-full p-2"
              >
                {/* TODO: REPLACE THIS LATER WITH THE ACTUAL AI EVALUATION!!!! */}
                <Link
                  href={design.figma_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="relative w-full aspect-video rounded-lg border overflow-hidden">

                    {/* Thumbnail Links */}
                    <Image
                      src={design.thumbnail_url || "/images/design-thumbnail.png"}
                      alt="Design thumbnail"
                      className="object-cover"
                      width={400}
                      height={400}
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
                    <span className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleLike(user.user_id, design.design_id)}
                        className="text-gray-500 hover:text-red-500 transition cursor-pointer"
                        title="Like"
                      >
                        {design.liked ? (
                          <IconHeartFilled size={20} className="text-red-500" />
                        ) : (
                          <IconHeart size={20} />
                        )}
                      </button>
                      {design.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconEye size={20} /> {design.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
