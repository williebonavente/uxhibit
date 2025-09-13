"use client";

import { useEffect, useState, useCallback } from "react";
import { IconEye, IconHeart, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { LoadingInspiration } from "./animation/loading-fetching";
import Image from "next/image";

type DesignRow = {
  is_published: any;
  id: string;
  title: string;
  thumbnail_url: string | null;
  file_key: string | null;
  node_id: string | null;
  current_version_id: string | null;
  likes?: number | null;
  views?: number | null;
};

type PublishedDesign = {
  num_of_hearts: number;
  num_of_views: number;
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
            : !!d.published_designs
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
      <div className="items-center justify-center text-center text-black dark:text-white">
        <div className="flex flex-col items-center justify-center text-center">
          <Image
            src="/images/let-go-of-this-design.svg"
            alt="Delete design illustration"
            height={150}
            width={150}
            className="object-contain mt-3 mb-3"
            priority
          />
          <h2 className="text-lg font-semibold text-[#ED5E20] mb-2">
            Let go of this design?
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-center items-center gap-2 mt-2 mb-3">
          <button
            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm font-semibold cursor-pointer"
            onClick={() => {
              setShowOverlay(false);
              toast.dismiss();
            }}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-[#ED5E20] hover:bg-[#d44e0f] text-sm font-semibold text-white cursor-pointer"
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
        className: "bg-white dark:bg-[#120F12] text-black dark:text-white rounded-2xl items-center justify-center text-center",
        onAutoClose: () => setShowOverlay(false),
      }
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 animate-pulse">
        <Image
          src="/images/loading-your-designs.svg"
          alt="Loading designs illustration"
          height={150}
          width={150}
          className="object-contain mb-6"
          priority
        />
        <p className="text-gray-500 text-sm mb-4">
          Loading your desings...
        </p>
      </div>
    );
  }
  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24">
        <Image
          src="/images/your-gallery-is-waiting-for-its-first-design.svg"
          alt="No designs illustration"
          height={150}
          width={150}
          className="object-contain mb-6"
          priority
        />
        <h2 className="text-lg font-semibold text-[#ED5E20] mb-2">
          No Designs Yet
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Your gallery is waiting for its first design!
        </p>
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
          <div className="p-1 space-y-2 group relative">
            <Link
              href={`/designs/${design.id}`}
              rel="noopener noreferrer"
            >
              <div className="relative w-full aspect-video rounded-lg border overflow-hidden mb-3">
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
            {design.is_published && (
              <div className="flex justify-start items-center gap-2 text-green-600 text-xs animate-pulse">
                <svg
                  width="12"
                  height="12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="inline-block drop-shadow-[0_0_1px_#22c55e]"
                  style={{ filter: "drop-shadow(0 0 6px #22c55e)" }}
                >
                  <circle cx="12" cy="12" r="8" fill="currentColor" />
                  <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                <span className="drop-shadow-[0_0_1px_#22c55e]">Now Live</span>
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