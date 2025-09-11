"use client";

import { useEffect, useState, useCallback } from "react";
import { IconEye, IconHeart, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { LoadingInspiration } from "./animation/loading-fetching";

type DesignRow = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  file_key: string | null;
  node_id: string | null;
  current_version_id: string | null;
  likes?: number | null;
  views?: number | null;
  is_published: boolean;
};

type PublishedDesign = {
  num_of_hearts: number;
  num_of_views: number;
  is_published: boolean;
};

export default function DesignsGallery() {
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

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

  const loadDesigns = useCallback(async () => {
    if (!currentUserId) return; // Wait for user ID
    setLoading(true);
    const { data, error } = await supabase
      .from("designs")
      .select(`id,
              title,
              thumbnail_url,
              file_key,
              node_id,
              current_version_id,
              published_designs(num_of_hearts, num_of_views) 
              `)
      .eq("owner_id", currentUserId) // Only fetch owner's designs
      .order("updated_at", { ascending: false });
    console.log("Designs data:", data);
    if (error) {
      console.error(error);
      setDesigns([]);
      setLoading(false);
      return;
    }
    const withThumbs = await Promise.all(
      (data || []).map(async (d) => {
        let likes = 0;
        let views = 0;
        const pub = d.published_designs as PublishedDesign | PublishedDesign[] | null | undefined;
        if (pub) {
          if (Array.isArray(pub)) {
            likes = pub[0]?.num_of_hearts ?? 0;
            views = pub[0]?.num_of_views ?? 0;
          } else {
            likes = pub.num_of_hearts ?? 0;
            views = pub.num_of_views ?? 0;
          }
        }
        return {
          ...d,
          thumbnail_url: await resolveThumbnail(d.thumbnail_url),
          likes,
          views,
          is_published: Array.isArray(d.published_designs)
            ? d.published_designs.length > 0
            : !!d.published_designs,
        };
      })
    );
    setDesigns(withThumbs);
    setLoading(false);
  }, [supabase, resolveThumbnail, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      loadDesigns();
    }
  }, [loadDesigns, currentUserId]);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    fetchUser();
  }, []);

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
              try {
                // First get design info for logging and storage cleanup
                const { data: design } = await supabase
                  .from("designs")
                  .select(`
                  title, 
                  thumbnail_url,
                  published_designs(id), 
                  design_versions!design_versions_design_id_fkey (
                    id,
                    thumbnail_url
                  )
                `)
                  .eq("id", id)
                  .single();

                // Check if published (adjust this logic to your schema)
                if (design?.published_designs && design.published_designs.length > 0) {
                  toast.error("This design cannot be deleted since it is currently published.");
                  setShowOverlay(false);
                  toast.dismiss();
                  return;
                }

                // Collect all storage paths to delete
                const storagePaths: string[] = [];

                // Add main design thumbnail if it's a storage path
                if (design?.thumbnail_url && !design.thumbnail_url.startsWith('http')) {
                  storagePaths.push(design.thumbnail_url);
                }

                // Add version thumbnails if they're storage paths
                design?.design_versions?.forEach(version => {
                  if (version.thumbnail_url && !version.thumbnail_url.startsWith('http')) {
                    storagePaths.push(version.thumbnail_url);
                  }
                });

                // Delete storage files first
                if (storagePaths.length > 0) {
                  const { error: storageError } = await supabase
                    .storage
                    .from('design-thumbnails')
                    .remove(storagePaths);

                  if (storageError) {
                    console.error('Failed to delete storage files:', storageError);
                    // Continue with DB deletion even if storage fails
                  }
                }

                // Clear current_version_id first
                const { error: updateError } = await supabase
                  .from("designs")
                  .update({ current_version_id: null })
                  .eq("id", id);

                if (updateError) {
                  console.error('Failed to clear current version:', updateError);
                  throw updateError;
                }

                // Delete design versions
                const { error: versionsError } = await supabase
                  .from("design_versions")
                  .delete()
                  .eq("design_id", id);

                if (versionsError) {
                  console.error('Failed to delete versions:', versionsError);
                  throw versionsError;
                }

                // Finally delete the design
                const { error: deleteError } = await supabase
                  .from("designs")
                  .delete()
                  .eq("id", id);

                if (deleteError) {
                  console.error('Delete failed:', {
                    error: deleteError,
                    designId: id,
                    designTitle: design?.title
                  });
                  toast.error(`Delete failed: ${deleteError.message}`);
                } else {
                  console.log('Design, versions, and files deleted successfully:', {
                    designId: id,
                    designTitle: design?.title,
                    deletedFiles: storagePaths
                  });
                  setDesigns((d) => d.filter((x) => x.id !== id));
                  toast.success("Design deleted successfully");
                }
              } catch (err) {
                console.error('Unexpected error during delete:', err);
                toast.error("An unexpected error occurred");
              } finally {
                setShowOverlay(false);
                toast.dismiss();
              }
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
    return <LoadingInspiration
      text={"Getting your creative designs..."}
    />;
  }
  if (designs.length === 0) {
    return (
      <div className="mt-15 flex flex-col items-center justify-center text-center">
        <img
          src="/images/empty-design.svg"
          alt="No designs illustration"
          className="w-45 h-45 object-contain mx-auto opacity-25"
        />
        <p className="text-[#6A6F6F]/50 text-md">No designs uploaded yet.</p>
      </div>
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
            {/* Warning if published */}
            {design.is_published && (
              <div className="flex items-center gap-1 text-yellow-600 text-xs mb-1">
                <svg width="16" height="16" fill="currentColor" className="inline-block">
                  <path d="M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333zm0 12A5.333 5.333 0 1 1 8 2.667a5.333 5.333 0 0 1 0 10.666zm-.667-8h1.334v4H7.333zm0 5.333h1.334v1.334H7.333z" />
                </svg>
                <span>Currently published</span>
              </div>
            )}
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
