"use client";

import { useEffect, useState, useCallback } from "react";
import { IconEdit, IconRocket, IconArchive, IconFilter, IconHeart, IconLayoutGrid, IconList, IconTrash, IconEye } from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { LoadingInspiration } from "./animation/loading-fetching";
import Image from "next/image";
import PublishConfirmModal from "@/app/designs/[id]/dialogs/PublishConfirmModal";

type DesignRow = {
  is_published: boolean;
  id: string;
  title: string;
  thumbnail_url: string | null;
  thumbnail_storage_path: string | null; // This is the original storage path
  file_key: string | null;
  node_id: string | null;
  current_version_id: string | null;
  likes?: number | null;
  views?: number | null;
};

type PublishedDesign = {
  num_of_hearts: number;
  is_active: boolean;
  num_of_views: number;
};

export default function DesignsGallery() {
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [filter, setFilter] = useState<"all" | "published" | "unpublished">("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredDesigns = designs.filter((d) => {
    if (filter === "published") return d.is_published;
    if (filter === "unpublished") return !d.is_published;
    return true; // "all"
  });
  const supabase = createClient();

  const resolveThumbnail = useCallback(
    async (thumb: string | null) => {
      if (!thumb) return null;
      if (thumb.startsWith("http")) return thumb;
      const { data } = await supabase.storage
        .from("design-thumbnails")
        .createSignedUrl(thumb, 3600);
      if (data?.signedUrl) {
        console.log(
          `[resolveThumbnail] Generated new signed URL for: ${thumb}`,
          data.signedUrl
        );
      } else {
        console.warn(
          `[resolveThumbnail] Failed to generate signed URL for: ${thumb}`
        );
      }
      return data?.signedUrl || null;
    },
    [supabase]
  );

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
      loadDesigns();
    }
  };

  const loadDesigns = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("designs")
      .select(`id,
              title,
              thumbnail_url,
              file_key,
              node_id,
              current_version_id,
              published_designs(is_active, num_of_hearts, num_of_views) 
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
          thumbnail_storage_path: d.thumbnail_url,
          thumbnail_url: await resolveThumbnail(d.thumbnail_url),
          likes,
          views,
          is_published: Array.isArray(d.published_designs)
            ? d.published_designs.some((p) => p.is_active)
            : !!(d.published_designs && d.published_designs.is_active)
        };
      })
    );
    // Log all published designs
    withThumbs.forEach((d) => {
      if (d.is_published) {
        console.log("Published design:", d.id, d.title);
      }
    });
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

  useEffect(() => {
    const interval = setInterval(() => {
      loadDesigns();
    }, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDesigns]);

  const handleDelete = (id: string,
    isPublished: boolean) => {
    setShowOverlay(true);

    if (isPublished) {
      toast(
        <div  className="items-center justify-center text-center text-black dark:text-white">
          <div className="flex flex-col items-center justify-center text-center">
            <Image
              src="/images/let-go-of-this-design.svg"
              alt="Delete design illustration"
              height={150}
              width={150}
              className="object-contain mt-3 mb-3"
              priority
            />
            <h2 className="text-lg font-semibold text-yellow-700 mb-2">
              Warning: Published Design
            </h2>
            <p className="text-sm text-yellow-800 mb-1">
              <span className="font-bold">This design is currently published.</span>
            </p>
            <p className="text-sm text-yellow-800 mb-1">
              Unpublish it before deleting.
            </p>
            <p className="text-xs italic text-yellow-600">
              Published designs are visible to others and cannot be deleted directly
              for safety.
            </p>
          </div>
          <div className="flex justify-center items-center gap-2 mt-2 mb-3">
            <button
              className="px-6 py-2 rounded-lg bg-[#ED5E20] hover:bg-[#d44e0f] text-sm font-semibold text-white cursor-pointer"
              onClick={() => {
                setShowOverlay(false);
                toast.dismiss();
              }}
            >
              Got it
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
      return;
    }

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
                    thumbnail_url)`)
                  .eq("id", id)
                  .single();

                // Check if published (adjust this logic to your schema)
                if (design?.published_designs && design.published_designs.length > 0) {
                  toast.error("This design cannot be deleted since it is currently published.");
                  setShowOverlay(false);
                  toast.dismiss();
                  return;
                }

                const storagePaths: string[] = [];

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
                  }
                }
                const { error: updateError } = await supabase
                  .from("designs")
                  .update({ current_version_id: null })
                  .eq("id", id);

                if (updateError) {
                  console.error('Failed to clear current version:', updateError);
                  throw updateError;
                }
                const { error: versionsError } = await supabase
                  .from("design_versions")
                  .delete()
                  .eq("design_id", id);

                if (versionsError) {
                  console.error('Failed to delete versions:', versionsError);
                  throw versionsError;
                }

                const { error: commentsError } = await supabase 
                .from("comments")
                .delete()
                .eq("design_id", id);

                if (commentsError) {
                  console.error(`Failed to delete coments: " ${commentsError.message}`);
                  throw commentsError;
                }

                const { error: deleteError } = await supabase
                  .from("designs")
                  .delete()
                  .eq("id", id);

                if (deleteError) {
                  console.error('Delete failed:', {
                    error: deleteError,
                    designId: id,
                    designTitle: design?.title
                  }, deleteError.message);
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

  // Unified publish/unpublish handler
  const togglePublish = async (design: DesignRow) => {
    try {
      const newStatus = !design.is_published;

      // Update the published_designs table
      const { data, error } = await supabase
        .from("published_designs")
        .update({ is_active: newStatus })
        .eq("design_id", design.id)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
        toast.error(`Update failed: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Update failed: No rows updated (check permissions or RLS).");
        return;
      }

      // Update local state
      setDesigns((prev) =>
        prev.map((d) =>
          d.id === design.id ? { ...d, is_published: newStatus } : d
        )
      );

      toast.success(
        newStatus ? "Design published successfully" : "Design unpublished successfully"
      );
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(`Unexpected error: ${err.message || err}`);
    }
  };

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<DesignRow | null>(null);
  const [publishMode, setPublishMode] = useState<"publish" | "unpublish">("publish");

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
          Loading your designs...
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
        <h2 className="gradient-text inline-block text-lg font-semibold mb-2">
          No Designs Yet
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Your gallery is waiting for its first design!
        </p>
      </div>
    );
  }

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
          Loading your designs...
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
        <h2 className="gradient-text inline-block text-lg font-semibold mb-2">
          No Designs Yet
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Your gallery is waiting for its first design!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5"> 
      <div className="flex justify-end items-center gap-2 mb-3 relative">
        {/* Filter Button */}
        <div className="relative inline-block text-left">
          <button
            onClick={() => setShowFilterDropdown((prev) => !prev)}
            className="w-10 h-10 flex justify-center items-center rounded-lg bg-transparent text-white hover:bg-[#ED5E20]/50 cursor-pointer transition-colors"
            title="Filter Designs"
          >
            <IconFilter size={20} />
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-accent border z-10">
              <div className="py-1">
                <button
                  onClick={() => { setFilter("all"); setShowFilterDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-[#ED5E20]/20 cursor-pointer"
                >
                  All
                </button>
                <button
                  onClick={() => { setFilter("published"); setShowFilterDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-[#ED5E20]/20 cursor-pointer"
                >
                  Published
                </button>
                <button
                  onClick={() => { setFilter("unpublished"); setShowFilterDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-[#ED5E20]/20 cursor-pointer"
                >
                  Unpublished
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grid/List Toggle Buttons */}
        <button
          onClick={() => setViewMode("grid")}
          className={`w-10 h-10 flex justify-center items-center rounded-lg cursor-pointer transition-colors hover:bg-[#ED5E20]/50 ${
            viewMode === "grid" ? "bg-[#ED5E20]/20 text-[#ED5E20]" : "text-[#ED5E20] dark:text-white"
          }`}
          title="Grid View"
        >
          <IconLayoutGrid size={20} />
        </button>

        <button
          onClick={() => setViewMode("list")}
          className={`w-10 h-10 flex justify-center items-center rounded-lg cursor-pointer transition-colors hover:bg-[#ED5E20]/50 ${
            viewMode === "list" ? "bg-[#ED5E20]/20 text-[#ED5E20]" : "text-[#ED5E20] dark:text-white"
          }`}
          title="List View"
        >
          <IconList size={20} />
        </button>
      </div>

      {/* Gallery */}
      {filteredDesigns.length === 0 ? (
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
            {filter === "published"
              ? "No Published Designs Yet"
              : filter === "unpublished"
              ? "No Unpublished Designs Yet"
              : "No Designs Yet"}
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            {filter === "published"
              ? "You don’t have any published designs yet."
              : filter === "unpublished"
              ? "You don’t have any unpublished designs yet."
              : "Your gallery is waiting for its first design!"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-2 sm:px-0 items-stretch">
          {filteredDesigns.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              handleDelete={handleDelete}
              handleNameChange={handleNameChange}
              resolveThumbnail={resolveThumbnail}
              setDesigns={setDesigns}
              showOverlay={showOverlay}
              supabase={supabase}
              onTogglePublish={togglePublish}
              setSelectedDesign={setSelectedDesign}
              setPublishModalOpen={setPublishModalOpen}
              setPublishMode={setPublishMode}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDesigns.map((design) => (
            <DesignListRow
              key={design.id}
              design={design}
              handleDelete={handleDelete}
              handleNameChange={handleNameChange}
              resolveThumbnail={resolveThumbnail}
              setDesigns={setDesigns}
              showOverlay={showOverlay}
              supabase={supabase}
              onTogglePublish={togglePublish}
              setSelectedDesign={setSelectedDesign}
              setPublishModalOpen={setPublishModalOpen}
              setPublishMode={setPublishMode}
            />
          ))}
        </div>
      )}

      {/* Publish/Unpublish Modal */}
      {selectedDesign && (
      <PublishConfirmModal
        open={publishModalOpen}
        mode={publishMode}
        onClose={() => setPublishModalOpen(false)}
        onConfirm={async () => {
          if (selectedDesign) {
            await togglePublish(selectedDesign); // actually toggle after confirmation
            setPublishModalOpen(false);
          }
        }}
      />
    )}

    </div>
  );
}

function DesignCard({
  design,
  handleDelete,
  handleNameChange,
  resolveThumbnail,
  setDesigns,
  showOverlay,
  onTogglePublish,
  setSelectedDesign,
  setPublishModalOpen,
  setPublishMode,
}: any) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className="group bg-white dark:bg-[#1A1A1A] rounded-xl p-2 shadow-md flex flex-col h-full relative cursor-pointer"
      onClick={() => {
        if (!isEditing) {
          window.location.href = `/designs/${design.id}`;
        }
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video rounded-lg border overflow-hidden mb-3">
        <Image
          src={design.thumbnail_url || "/images/placeholder.png"}
          alt={design.title || "Design Preview"}
          fill
          className="object-cover bg-accent/10 dark:bg-accent"
          sizes="(min-width:1280px) 1280px, 100vw"
          onError={async () => {
            if (design.thumbnail_storage_path && !design.thumbnail_storage_path.startsWith("http")) {
              const newUrl = await resolveThumbnail(design.thumbnail_storage_path);
              setDesigns((ds: any[]) =>
                ds.map((d) => (d.id === design.id ? { ...d, thumbnail_url: newUrl } : d))
              );
            }
          }}
        />
      </div>

      {/* Title + Buttons */}
      <div className="flex items-center justify-between gap-2 mb-1">
        {isEditing ? (
          <input
            type="text"
            value={design.title}
            onChange={(e) => handleNameChange(design.id, e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="w-full bg-transparent focus:outline-none border-b border-white/30 text-black dark:text-white"
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="w-full max-w-full overflow-hidden">
            <p className="text-lg text-black dark:text-white truncate whitespace-nowrap overflow-ellipsis">{design.title}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            title="Edit"
            className="text-gray-500 hover:text-blue-500 cursor-pointer"
          >
            <IconEdit size={20} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDesign(design);
              setPublishMode(design.is_published ? "unpublish" : "publish");
              setPublishModalOpen(true);
            }}
            title={design.is_published ? "Unpublish" : "Publish"}
            className={`text-gray-500 ${
              design.is_published ? "hover:text-yellow-500" : "hover:text-green-500"
            } transition cursor-pointer`}
          >
            {design.is_published ? <IconArchive size={20} /> : <IconRocket size={20} />}
          </button>


          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(design.id, design.is_published); }}
            title="Delete"
            className="text-gray-500 hover:text-red-500 cursor-pointer"
          >
            <IconTrash size={20} />
          </button>
        </div>
      </div>

      {/* Published badge */}
      {design.is_published && (
        <div className="flex items-center gap-2 text-green-600 text-xs animate-pulse">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" className="inline-block drop-shadow-[0_0_1px_#22c55e]" style={{ filter: "drop-shadow(0 0 6px #22c55e)" }}>
            <circle cx="12" cy="12" r="8" fill="currentColor" />
            <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <span className="drop-shadow-[0_0_1px_#22c55e]">Now Live</span>
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-gray-500 flex items-center justify-between mt-2">
        <span className="flex items-center gap-1"><IconHeart size={18} /> {design.likes ?? 0}</span>
        <span className="flex items-center gap-1"><IconEye size={18} /> {design.views ?? 0}</span>
      </div>

      {showOverlay && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />}
    </div>
  );
}

function DesignListRow({
  design,
  handleDelete,
  handleNameChange,
  resolveThumbnail,
  setDesigns,
  showOverlay,
  onTogglePublish,
  setSelectedDesign,
  setPublishModalOpen,
  setPublishMode,
}: any) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className="relative group flex items-start gap-4 bg-accent dark:bg-[#1A1A1A] rounded-xl p-2 hover:bg-accent/80 transition cursor-pointer"
      onClick={() => !isEditing && (window.location.href = `/designs/${design.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative w-40 h-20 rounded-lg border overflow-hidden shrink-0">
        <Image
          src={design.thumbnail_url || "/images/placeholder.png"}
          alt={design.title || "Design Preview"}
          fill
          className="object-cover bg-white dark:bg-accent"
          onError={async () => {
            if (design.thumbnail_storage_path && !design.thumbnail_storage_path.startsWith("http")) {
              const newUrl = await resolveThumbnail(design.thumbnail_storage_path);
              setDesigns((ds: any[]) =>
                ds.map((d) => (d.id === design.id ? { ...d, thumbnail_url: newUrl } : d))
              );
            }
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Top row: file name + buttons */}
        <div className="flex flex-col items-start justify-center gap-2">
          {isEditing ? (
            <input
              type="text"
              value={design.title}
              onChange={(e) => handleNameChange(design.id, e.target.value)}
              onBlur={() => setIsEditing(false)}
              autoFocus
              className="w-full bg-transparent text-lg focus:outline-none border-b border-white/30 text-black dark:text-white"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="w-full max-w-full overflow-hidden">
              <p className="text-lg text-black dark:text-white truncate whitespace-nowrap overflow-ellipsis">{design.title}</p>
            </div>
          )}

          {/* Now Live badge */}
          {design.is_published && (
            <div className="flex items-center gap-2 text-green-600 text-xs animate-pulse">
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

          {/* Hearts & Views */}
          <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1">
              <IconHeart size={16} /> {design.likes ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <IconEye size={16} /> {design.views ?? 0}
            </span>
          </div>
        </div>   
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition shrink-0 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          title="Edit"
          className="text-gray-500 hover:text-blue-500 cursor-pointer"
        >
          <IconEdit size={20} />
        </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedDesign(design);
          setPublishMode(design.is_published ? "unpublish" : "publish");
          setPublishModalOpen(true);
        }}
        title={design.is_published ? "Unpublish" : "Publish"}
        className={`text-gray-500 ${
          design.is_published ? "hover:text-yellow-500" : "hover:text-green-500"
        } transition cursor-pointer`}
      >
        {design.is_published ? <IconArchive size={20} /> : <IconRocket size={20} />}
      </button>


        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(design.id, design.is_published); }}
          title="Delete"
          className="text-gray-500 hover:text-red-500 cursor-pointer"
        >
          <IconTrash size={20} />
        </button>
      </div>
      {showOverlay && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />}
    </div>
  );
}