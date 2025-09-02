"use client";

import { useEffect, useState, useCallback } from "react";
import { IconEye, IconHeart, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
// CHANGED: import Supabase client (instead of localStorage)
import { createClient } from "@/utils/supabase/client";

type DesignRow = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  file_key: string | null;
  node_id: string | null;
  current_version_id: string | null;
  // Optional stats (add in DB if needed)
  likes?: number | null;
  views?: number | null;
};

export default function DesignsGallery() {
  // CHANGED: strongly typed state
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  const supabase = createClient();

  // CHANGED: helper to sign private path thumbnails
  const resolveThumbnail = useCallback(
    async (thumb: string | null) => {
      if (!thumb) return null;
      if (thumb.startsWith("http")) return thumb; // already URL
      const { data } = await supabase.storage
        .from("design-thumbnails")
        .createSignedUrl(thumb, 3600);
      return data?.signedUrl || null;
    },
    [supabase]
  );

  // CHANGED: load from database instead of localStorage
  const loadDesigns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("designs")
      // likes and view to be implemented
      .select("id,title,thumbnail_url,file_key,node_id,current_version_id")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error(error);
      setDesigns([]);
      setLoading(false);
      return;
    }
    // Sign thumbnails as needed (parallel)
    const withThumbs = await Promise.all(
      (data || []).map(async (d) => ({
        ...d,
        thumbnail_url: await resolveThumbnail(d.thumbnail_url),
      }))
    );
    setDesigns(withThumbs);
    setLoading(false);
  }, [supabase, resolveThumbnail]);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  // OPTIONAL REALTIME (uncomment if you enabled Realtime on table)
  // useEffect(() => {
  //   const channel = supabase
  //     .channel("designs-changes")
  //     .on("postgres_changes",
  //       { event: "*", schema: "public", table: "designs" },
  //       () => { loadDesigns(); }
  //     )
  //     .subscribe();
  //   return () => { supabase.removeChannel(channel); };
  // }, [supabase, loadDesigns]);

  // CHANGED: update DB title instead of localStorage
  const handleNameChange = async (id: string, newName: string) => {
    setDesigns((ds) =>
      ds.map((d) => (d.id === id ? { ...d, title: newName } : d))
    );
    const { error } = await supabase
      .from("designs")
      .update({ title: newName })
      .eq("id", id);
    if (error) {
      toast.error("Rename failed");
      // revert on error
      loadDesigns();
    }
  };

  // CHANGED: delete from DB
  const handleDelete = (id: string) => {
    setShowOverlay(true);
    toast(
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <IconTrash size={40} className="text-red-500" />
          <div>
            <div className="font-semibold text-base">Delete Design?</div>
            <div className="text-sm text-gray-700">
              This action cannot be undone.
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold w-full sm:w-auto"
            onClick={() => {
              setShowOverlay(false);
              toast.dismiss();
            }}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 font-semibold w-full sm:w-auto"
            onClick={async () => {
              const { error } = await supabase
                .from("designs")
                .delete()
                .eq("id", id);
              if (error) toast.error("Delete failed");
              else {
                setDesigns((d) => d.filter((x) => x.id !== id));
                toast.success("Deleted");
              }
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
        duration: 999999,
        className: "rounded-xl",
        onAutoClose: () => setShowOverlay(false),
      }
    );
  };

  if (loading) {
    return <p className="mt-4 text-gray-400 text-sm">Loading designs...</p>;
  }

  if (designs.length === 0) {
    return (
      <p className="mt-4 text-gray-400 text-sm">No designs uploaded yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-2 sm:px-0 items-stretch">
      {designs.map((design) => (
        <div
          key={design.id}
          className="bg-accent dark:bg-[#1A1A1A] rounded-xl shadow-md space-y-0 flex flex-col h-full p-2"
        >
          <Link
            href={`/designs/${design.id}`}
            rel="noopener noreferrer"
          >
            <div className="relative w-full aspect-video rounded-lg border overflow-hidden">
              <Image
                // CHANGED: prefer stored signed/public thumbnail; fallback to Figma endpoint or placeholder
                src={
                  design.thumbnail_url
                    ? design.thumbnail_url
                    : design.file_key
                      ? `/api/figma/thumbnail?fileKey=${design.file_key}${design.node_id
                        ? `&nodeId=${encodeURIComponent(design.node_id)}`
                        : ""
                      }`
                      : "/images/design-thumbnail.png"
                }
                alt={design.title || "Design Preview"}
                fill
                className="object-cover"
                sizes="(min-width:1280px) 1280px, 100vw"
              />
            </div>
          </Link>
          <div className="p-3 space-y-2 group relative">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={design.title}
                onChange={(e) => handleNameChange(design.id, e.target.value)}
                className="w-full bg-transparent text-lg focus:outline-none"
              />
              <button
                style={{
                  cursor: "url('/cursors/cursor-pointer.svg') 3 3, pointer"
                }}
                className="text-gray-500 text-xl hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                title="Delete"
                onClick={() => handleDelete(design.id)}
              >
                <IconTrash size={20} />
              </button>
              {showOverlay && (
                <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
              )}
            </div>
            <div className="text-sm text-gray-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <IconHeart size={18} /> {design.likes ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <IconEye size={18} /> {design.views ?? 0}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
