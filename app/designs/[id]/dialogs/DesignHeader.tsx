import React from "react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
    IconHistory,
    IconSearch,
    IconFilter,
    IconSortAscending,
    IconSortDescending,
    IconArrowLeft,
    IconSend,
} from "@tabler/icons-react";
import { Menu, MessageSquare } from "lucide-react";
import CommentModal from "./CommentModal";
import { Comment } from "@/components/comments-user";
import { Design, Versions } from "../page";
import PublishConfirmModal from "./PublishConfirmModal";

interface DesignHeaderActionsProps {
    handleShowVersions: () => void;
    handleOpenComments: () => void;
    showComments: boolean;
    setShowComments: (show: boolean) => void;
    comments: Comment[];
    loadingComments: boolean;
    showSearch: boolean;
    setShowSearch: (show: boolean) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    showSortOptions: boolean;
    setShowSortOptions: (show: boolean) => void;
    sortOrder: "default" | "asc" | "desc";
    setSortOrder: (order: "default" | "asc" | "desc") => void;
    sortRef: React.RefObject<HTMLDivElement | null>;
    design: Design;
    selectedVersion: Versions | null;
    publishProject: () => Promise<void>;
    unpublishProject: () => Promise<void>;
    syncPublishedState: () => Promise<void>;
}

const DesignHeaderActions: React.FC<DesignHeaderActionsProps> = ({
    handleShowVersions,
    handleOpenComments,
    showComments,
    setShowComments,
    comments,
    loadingComments,
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    showSortOptions,
    setShowSortOptions,
    sortOrder,
    setSortOrder,
    sortRef,
    design,
    selectedVersion,
    publishProject,
    unpublishProject,
    syncPublishedState,
}) => {
    const [showPublishModal, setShowPublishModal] = useState(false);
    const handlePublishConfirm = async () => {
        setShowPublishModal(false);
        await publishProject();
        await syncPublishedState();
    };

    const handleUnpublishConfirm = async () => {
        setShowPublishModal(false);
        await unpublishProject();
        await syncPublishedState();
    }

    async function markCommentAsRead(id: string) {
        const supabase = createClient();
        await supabase.from("comments").update({ is_read: true }).eq("id", id);
        // TODO: refresh comments here
    }
    async function markCommentAsUnread(id: string) {
        const supabase = createClient();
        await supabase.from("comments").update({ is_read: false }).eq("id", id);
        // TODO: refresh comments here
    }

    const router = useRouter();

    return (
        <div className="flex gap-2 items-center justify-between w-full">
            <div className="flex items-center mr-4">
                <button
                    onClick={() => {
                        if (window.history.length > 1) {
                            router.back();
                        } else {
                            router.push("/dashboard");
                        }
                    }}
                    aria-label="Go Back"
                    className="p-1"
                >
                    <IconArrowLeft size={24} className="cursor-pointer hover:text-orange-600 mr-2" />
                </button>
                <h1 className="text-xl font-medium">
                    {design.project_name}
                    {selectedVersion && selectedVersion.id !== design.current_version_id
                        ? ` (v${selectedVersion.version})`
                        : ""}
                </h1>
            </div>
            {/* Wrapper */}
            <div className="relative flex gap-2 items-center mr-18">
                <div className="relative group mr-2 mt-1">
                    <button className="cursor-pointer" onClick={() => {
                        setShowSortOptions(false);
                        setShowSearch(false);
                        setShowComments(false);
                        setShowPublishModal(true);
                    }} aria-label="Publish">
                        {design.is_active ? (
                            <div className="relative inline-flex items-center">
                                <span className="absolute inline-flex h-6 w-6 rounded-full bg-green-400 opacity-65 animate-ping"></span>
                                <IconSend
                                    size={20}
                                    className="relative z-10 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.7)] animate-pulse"
                                />
                            </div>
                        ) : (
                            <IconSend size={20} />
                        )}
                    </button>
                    {/* Tooltip  */}
                    <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                        <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
                            {design.is_active ? "Unpublish" : "Publish"}
                        </div>
                    </div>
                    <PublishConfirmModal
                        open={showPublishModal}
                        onClose={() => setShowPublishModal(false)}
                        onConfirm={design.is_active ? handleUnpublishConfirm : handlePublishConfirm}
                        mode={design.is_active ? "unpublish" : "publish"}
                    />
                </div>
                {/* Version History */}
                <div className="relative group">
                    <button
                        onClick={() => {
                            setShowSortOptions(false);
                            setShowSearch(false);
                            setShowComments(false);
                            setShowPublishModal(false);
                            handleShowVersions();
                        }}
                        className="cursor-pointer p-2 rounded hover:bg-[#ED5E20]/15 hover:text-[#ED5E20] transition"
                        aria-label="Show Version History"
                    >
                        <IconHistory size={22} />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                        <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
                            Version History
                        </div>
                    </div>
                </div>

                {/* Comments */}
                <div className="relative group">
                    <button
                        className="cursor-pointer p-2 rounded hover:bg-[#ED5E20]/15 hover:text-[#ED5E20] transition"
                        aria-label="Show Comments"
                        onClick={() => {
                            setShowSortOptions(false);
                            setShowSearch(false);
                            setShowPublishModal(false);
                            handleOpenComments();
                        }}
                    >
                        <MessageSquare size={22} />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                        <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
                            Comments
                        </div>
                    </div>

                </div>
                <CommentModal
                    open={showComments}
                    onClose={() => setShowComments(false)}
                    comments={comments}
                    loading={loadingComments}
                    markCommentAsRead={markCommentAsRead}
                    markCommentAsUnread={markCommentAsUnread}
                />
                {/* SEARCH */}
                <div className="relative group">
                    <button
                        className="cursor-pointer p-2 rounded hover:bg-[#ED5E20]/15 hover:text-[#ED5E20] transition"
                        aria-label="Search"
                        onClick={() => {
                            setShowSortOptions(false);
                            setShowComments(false);
                            setShowPublishModal(false);
                            setShowSearch(!showSearch);
                        }}
                    >
                        <IconSearch size={20} />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                        <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
                            Search
                        </div>
                    </div>
                    {/* Popover */}
                    {showSearch && (
                        <div
                            className="absolute left-1/2 top-full mt-3 -translate-x-1/2 z-30 w-72 rounded-xl shadow-2xl border border-[#ED5E20]/20
                            bg-white/80 dark:bg-[#232323]/80 backdrop-blur-lg animate-fade-in-up transition-all duration-300"
                            style={{
                                boxShadow: "0 8px 32px 0 rgba(237,94,32,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.08)",
                            }}
                        >

                            {/* Input with icon */}
                            <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                                <IconSearch size={18} className="text-[#ED5E20] opacity-80" />
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded border border-[#ED5E20]/30 focus:border-[#ED5E20] focus:ring-2 focus:ring-[#ED5E20]/20 outline-none bg-white/80 dark:bg-[#232323]/80 transition"
                                    placeholder="Search frames…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="px-4 pb-4">
                                <button
                                    className="mt-2 w-full bg-gradient-to-r from-[#ED5E20] 
                                    cursor-pointer
                                    to-orange-400 text-white rounded py-1 font-semibold shadow hover:from-orange-500 hover:to-[#ED5E20] transition"
                                    onClick={() => setShowSearch(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {/* SORT */}
                <div ref={sortRef} className="relative group">
                    <button
                        className={`flex items-center justify-center rounded-full cursor-pointer transition
                        ${showSortOptions ? "ring-2 ring-[#ED5E20] bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 shadow" : ""}
                        hover:bg-[#ED5E20]/15 hover:text-[#ED5E20] focus:ring-2 focus:ring-[#ED5E20]`}
                        tabIndex={0}
                        onClick={() => {
                            setShowSearch(false);
                            setShowComments(false);
                            setShowPublishModal(false);
                            setShowSortOptions(!showSortOptions);
                        }}
                        type="button"
                    >
                        <IconFilter size={22} className="text-inherit" />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                        <div className="px-3 py-1 rounded bg-gray-800/90 text-white text-xs shadow-lg whitespace-nowrap">
                            Sort Options
                        </div>
                    </div>
                    {/* Sort Buttons Dropdown */}
                    {showSortOptions && (
                        <div
                            className="absolute left-1/2 top-full mt-3 -translate-x-1/2 flex flex-col gap-2 bg-white dark:bg-[#232323] border border-[#ED5E20]/30 rounded-xl shadow-2xl p-3 z-30 min-w-[180px] animate-fade-in-up"
                            tabIndex={-1}
                            style={{
                                transition: "box-shadow 0.2s, border 0.2s",
                                boxShadow: "0 8px 32px 0 rgba(237,94,32,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.08)",
                            }}
                        >
                            <div className="mb-2 px-2 text-xs font-semibold text-[#ED5E20] tracking-widest uppercase opacity-80 select-none">
                                Sort Frames By
                            </div>
                            {/* Ascending */}
                            <button
                                onClick={() => { setSortOrder("asc"); setShowSortOptions(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base cursor-pointer font-medium transition
              ${sortOrder === "asc"
                                        ? "bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 text-[#ED5E20] shadow-md scale-105"
                                        : "bg-gray-100 dark:bg-[#232323] text-gray-700 dark:text-gray-200 hover:bg-[#ED5E20]/10 hover:text-[#ED5E20]"}
                group`}
                                aria-label="Sort by Lowest Score"
                            >
                                <span className="transition-transform group-hover:-translate-y-1 group-hover:scale-110">
                                    <IconSortAscending size={22} />
                                </span>
                                Lowest Score
                            </button>
                            {/* Descending */}
                            <button
                                onClick={() => { setSortOrder("desc"); setShowSortOptions(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition cursor-pointer
              ${sortOrder === "desc"
                                        ? "bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 text-[#ED5E20] shadow-md scale-105"
                                        : "bg-gray-100 dark:bg-[#232323] text-gray-700 dark:text-gray-200 hover:bg-[#ED5E20]/10 hover:text-[#ED5E20]"} group`}
                                aria-label="Sort by Highest Score"
                            >
                                <span className="transition-transform group-hover:-translate-y-1 group-hover:scale-110">
                                    <IconSortDescending size={22} />
                                </span>
                                Highest Score
                            </button>
                            {/* Default */}
                            <button
                                onClick={() => { setSortOrder("default"); setShowSortOptions(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition cursor-pointer
            ${sortOrder === "default"
                                        ? "bg-gradient-to-r from-[#ED5E20]/20 to-orange-400/20 text-[#ED5E20] shadow-md scale-105"
                                        : "bg-gray-100 dark:bg-[#232323] text-gray-700 dark:text-gray-200 hover:bg-[#ED5E20]/10 hover:text-[#ED5E20]"} group`}
                                aria-label="Default Order"
                            >
                                <span className="transition-transform group-hover:-translate-y-1 group-hover:scale-110">
                                    <Menu size={22} />
                                </span>
                                Default Order
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
};

export default DesignHeaderActions;