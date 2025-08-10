"use client";

import { useEffect, useState } from "react";
import { IconEye, IconHeart, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function DesignsGallery() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-2 sm:px-0">
      {designs.map((design) => (
        <div
          key={design.id}
          className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-md space-y-2"
        >
          <Link href={design.figma_link} target="_blank" rel="noopener noreferrer">
            <Image
              src="/images/design-thumbnail.png"
              alt="Figma Preview"
              width={400}
              height={300}
              className="w-full object-cover rounded-t-xl"
            />
          </Link>
          <div className="p-3 space-y-2 group relative">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={design.project_name}
                onChange={(e) => handleNameChange(design.id, e.target.value)}
                className="w-full bg-transparent text-lg border-gray-300 focus:outline-none"
              />

              <button
                className="text-gray-500 text-xl hover:text-red-500 transition cursor-pointer opacity-0 group-hover:opacity-100"
                title="Delete"
                onClick={() => {
                  setShowOverlay(true);
                  toast(
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <IconTrash size={40} className="text-red-500" />
                        <div>
                          <div className="font-semibold text-base">Delete Design?</div>
                          <div className="text-sm text-gray-700">
                            Are you sure you want to delete this design? This action cannot be undone.
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                        <button
                          className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold cursor-pointer w-full sm:w-auto"
                          onClick={() => {
                            setShowOverlay(false);
                            toast.dismiss();
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 font-semibold cursor-pointer w-full sm:w-auto"
                          onClick={() => {
                            handleDelete(design.id);
                            setShowOverlay(false);
                            toast.dismiss();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>,
                    {
                      position: "top-center",
                      style: {
                        width: "90vw",
                        maxWidth: "375px", // fits iPhone 6/7/8/X/SE and most mobile screens
                        minWidth: "280px",
                        padding: "16px 8px",
                        // boxSizing: "border-box",
                      },
                      className: "rounded-xl",
                      onAutoClose: () => setShowOverlay(false),
                      duration: 999999,
                    }
                  );
                }}
              >
                <IconTrash size={20} />
              </button>
              {showOverlay && (
                <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-all" />
              )}
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
