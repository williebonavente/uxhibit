"use client";

import { useEffect, useState } from "react";
import { IconEye, IconHeart, IconTrash } from "@tabler/icons-react";

export default function DesignsGallery() {
  const [designs, setDesigns] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("designs") || "[]");
    setDesigns(stored);
  }, []);

  const handleNameChange = (id: string, newName: string) => {
    const updated = designs.map((d) =>
      d.id === id ? { ...d, project_name: newName } : d
    );
    setDesigns(updated);
    localStorage.setItem("designs", JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    const updated = designs.filter((d) => d.id !== id);
    setDesigns(updated);
    localStorage.setItem("designs", JSON.stringify(updated));
  };

  if (designs.length === 0) {
    return (
      <p className="mt-4 text-gray-400 text-sm">No designs uploaded yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {designs.map((design) => (
        <div
          key={design.id}
          className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-md space-y-2"
        >
          <a href={design.figma_link} target="_blank" rel="noopener noreferrer">
            <img
              src="/images/design-thumbnail.png"
              alt="Figma Preview"
              className="w-full object-cover rounded-t-xl"
            />
          </a>
          <div className="p-3 space-y-2 group relative">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={design.project_name}
                onChange={(e) => handleNameChange(design.id, e.target.value)}
                className="w-full bg-transparent text-lg border-gray-300 focus:outline-none"
              />

              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this design?")) {
                    handleDelete(design.id);
                  }
                }}
                className="text-gray-500 text-xl hover:text-red-500 transition cursor-pointer opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <IconTrash size={20} />
              </button>
            </div>

            <div className="text-sm text-gray-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <IconHeart size={20} /> {design.likes}
              </span>
              <span className="flex items-center gap-1">
                <IconEye size={20} /> {design.views}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
