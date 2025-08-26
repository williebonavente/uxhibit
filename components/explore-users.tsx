"use client";

import { useState } from "react";
import {
  IconSearch,
  IconHeart,
  IconHeartFilled,
  IconEye,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

// Fetch this in database
const dummyUsers = [
  {
    id: 1,
    name: "Matthew Faulkerson Cucio",
    avatar: "https://i.pravatar.cc/150?img=1",
    designs: [
      {
        id: 101,
        project_name: "Portfolio Design",
        figma_link: "#",
        likes: 12,
        views: 88,
        liked: false,
      },
      {
        id: 102,
        project_name: "Dashboard UI",
        figma_link: "#",
        likes: 8,
        views: 61,
        liked: false,
      },
      {
        id: 103,
        project_name: "Website Design",
        figma_link: "#",
        likes: 19,
        views: 50,
        liked: false,
      },
      {
        id: 104,
        project_name: "Mobile Application",
        figma_link: "#",
        likes: 8,
        views: 61,
        liked: false,
      },
      {
        id: 105,
        project_name: "Facebook UI",
        figma_link: "#",
        likes: 19,
        views: 50,
        liked: false,
      },
      {
        id: 106,
        project_name: "Instagram UI",
        figma_link: "#",
        likes: 5,
        views: 24,
        liked: false,
      },
      {
        id: 107,
        project_name: "Portfolio",
        figma_link: "#",
        likes: 1,
        views: 5,
        liked: false,
      },
      {
        id: 108,
        project_name: "Student Portal",
        figma_link: "#",
        likes: 5,
        views: 10,
        liked: false,
      },
    ],
  },
  {
    id: 2,
    name: "John Mhike Delos Santos",
    avatar: "https://i.pravatar.cc/150?img=2",
    designs: [
      {
        id: 201,
        project_name: "Mobile Game",
        figma_link: "#",
        likes: 5,
        views: 47,
        liked: false,
      },
      {
        id: 202,
        project_name: "Pinterest UI",
        figma_link: "#",
        likes: 3,
        views: 6,
        liked: false,
      },
      {
        id: 203,
        project_name: "Messenger UI",
        figma_link: "#",
        likes: 17,
        views: 20,
        liked: false,
      },
      {
        id: 204,
        project_name: "Website Redesigned",
        figma_link: "#",
        likes: 20,
        views: 49,
        liked: false,
      },
    ],
  },
  {
    id: 3,
    name: "Macky Candelario",
    avatar: "https://i.pravatar.cc/150?img=3",
    designs: [
      {
        id: 301,
        project_name: "Social Media UI",
        figma_link: "#",
        likes: 12,
        views: 88,
        liked: false,
      },
      {
        id: 302,
        project_name: "Survey Form",
        figma_link: "#",
        likes: 8,
        views: 61,
        liked: false,
      },
      {
        id: 303,
        project_name: "Gamified Coaching App",
        figma_link: "#",
        likes: 6,
        views: 21,
        liked: false,
      },
      {
        id: 304,
        project_name: "Habit Tracker",
        figma_link: "#",
        likes: 28,
        views: 51,
        liked: false,
      },
    ],
  },
];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(dummyUsers);

  const handleToggleLike = (userId: number, designId: number) => {
    const updatedUsers = users.map((user) => {
      if (user.id !== userId) return user;
      return {
        ...user,
        designs: user.designs.map((design) =>
          design.id === designId
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
        <div key={user.id} className="bg-accent rounded-xl shadow p-5 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full"
              width={400}
              height={400}
            />
            <h2 className="text-lg font-medium">{user.name}</h2>
          </div>

          {/* User Designs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {user.designs.map((design) => (
              <div
                key={design.id}
                className="bg-accent dark:bg-[#1A1A1A] rounded-xl shadow-md space-y-0 flex flex-col h-full p-2"
              >
                <Link
                  href={design.figma_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="relative w-full aspect-video rounded-lg border overflow-hidden">
                    {/* Thumbnail Links */}
                    <Image
                      src={"/images/design-thumbnail.png"}
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
                        onClick={() => handleToggleLike(user.id, design.id)}
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
