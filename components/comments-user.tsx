import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { UserAvatar } from "./explore-users";
import {
    FiEdit2, FiTrash2,
    FiChevronDown, FiChevronRight,
    FiMessageCircle,
    FiMessageSquare
} from "react-icons/fi";

type User = {
    id: string;
    // userProfile: string; later to be implemented
    fullName: string;
    avatarUrl: string;
};

export type Comment = {
    user: User;
    id: string;
    design_id: string;
    text: string;
    replies?: Comment[];
    createdAt: Date;
    updatedAt?: Date;
    localTime: string,
    is_read: boolean,
};

interface CommentItemProps {
    comment: Comment;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    // replyingToId: string | null;
    // setReplyingToId: (id: string | null) => void;
    onDelete: (id: string) => void;
    depth?: number;
    //  onReply: (parentId: string, replyText: string) => Promise<void>;
}

export const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    editingId,
    setEditingId,
    // replyingToId,
    // setReplyingToId,
    onDelete,
    // onReply,
    depth = 0,
}) => {

    const supabase = createClient();

    const indent = Math.min(depth * 16, 32);

    const [replyText, setReplyText] = useState("");
    const [editText, setEditText] = useState(comment.text);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [postingReply, setPostingReply] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);

    // replying state
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);

    // const isReplying = replyingToId === comment.id;
    // const isEditing = editingId === comment.id;

    const handleEdit = () => {
        // setReplyingToId(null);
        setIsReplying(false);
        // setEditingId(comment.id);
        setIsEditing(true);
    }

    const handleReply = () => {
        // setEditingId(null);
        setIsEditing(false);
        setIsReplying(true);
        // setReplyingToId(comment.id)
    }

    const handleSaveEdit = async () => {
        if (!editText.trim()) {
            toast.error("Comment cannot be empty.");
            return;
        }
        setSavingEdit(true);
        const { error } = await supabase
            .from("comments")
            .update({
                text: editText,
                updated_at: new Date().toISOString(),
            })
            .eq("id", comment.id);

        setSavingEdit(false);

        if (error) {
            toast.error(`Failed to update comment! ${error.message}`);
            return;
        }

        comment.text = editText;
        comment.updatedAt = new Date();
        setEditingId(null);
        setIsEditing(false);
        toast.success("Comment updated!");
    }

    const handleCancelEdit = () => {
        // setEditingId(null);
        setIsEditing(false);
    }

    const handleDelete = async () => {
        if (comment.replies && comment.replies.length > 0) {
            let confirmed = false;
            await new Promise((resolve) => {
                toast(
                    <div>
                        <div>
                            This comment has replies.<br />
                            Deleting it will also remove all its replies.<br />
                            <b>Are you sure you want to continue?</b>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                className="bg-red-500 text-white px-3 py-1 rounded"
                                onClick={() => {
                                    confirmed = true;
                                    toast.dismiss();
                                    resolve(true);
                                }}
                            >
                                Delete
                            </button>
                            <button
                                className="bg-gray-300 text-black px-3 py-1 rounded"
                                onClick={() => {
                                    toast.dismiss();
                                    resolve(false);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>,
                    { duration: 999999, position: "top-center" }
                );
            });
            if (!confirmed) return;
        }

        const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", comment.id);

        if (error) {
            toast.error("Failed to delete comment!");
            return;
        }

        toast.info("Comment Deleted!");
        onDelete(comment.id);
    };

    const handleAddReply = async () => {
        if (!replyText.trim() || !currentUserId) return;
        setPostingReply(true);
        // await onReply(comment.id, replyText);
        const designId = comment.design_id;
        const { error } = await supabase
            .from("comments")
            .insert([
                {
                    user_id: currentUserId,
                    design_id: designId,
                    text: replyText,
                    parent_id: comment.id,
                    local_time: new Date().toLocaleTimeString(),
                },
            ]);
        setPostingReply(false);
        if (error) {
            toast.error("Failed to add reply!");
            console.error(error.message);
            return;
        }
        setReplyText("");
        // setReplyingToId(null);
        setIsReplying(false);
    };

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id ?? null);
        };
        getUser();
    },);


    return (
        <div
            id={`comment-${comment.id}`}
            className="border rounded-lg p-3 mb-3 bg-white dark:bg-[#1e1e1e] shadow-sm transition-all duration-200 hover:shadow-md"
            style={{ marginLeft: indent }}
        >
            {/* Main comment header */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <UserAvatar
                        avatarPath={comment.user.avatarUrl}
                        alt={comment.user.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {comment.user.fullName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {comment.updatedAt
                            ? `Edited • ${comment.updatedAt.toLocaleDateString()} ${comment.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : `${comment.createdAt.toLocaleDateString()} ${new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                </div>
                {/* Actions (only for owner) */}
                {comment.user.id === currentUserId && !isEditing && (
                    <div className="flex gap-2 opacity-70 hover:opacity-100 transition-opacity">
                        <button
                            className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded cursor-pointer"
                            onClick={handleEdit}
                            title="Edit"
                        >
                            <FiEdit2 className="text-yellow-600 w-4 h-4" />
                        </button>
                        <button
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded cursor-pointer"
                            onClick={handleDelete}
                            title="Delete"
                        >
                            <FiTrash2 className="text-red-600 w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Comment content */}
            <div>
                {isEditing ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className={`border rounded px-3 py-2 flex-1 text-sm focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${savingEdit ? "cursor-not-allowed" : ""}`}
                            disabled={savingEdit}
                        />
                        <div className="flex gap-2">
                            <button
                                className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 ${savingEdit ? "cursor-not-allowed" : "cursor-pointer"}`}
                                onClick={handleSaveEdit}
                                disabled={!editText.trim() || savingEdit}
                            >
                                {savingEdit ? "Saving..." : "Save"}
                            </button>
                            <button
                                className={`bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer`}
                                onClick={handleCancelEdit}
                                disabled={savingEdit}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p
                        className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words 
                        px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 
                        border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                        {comment.text}
                    </p>

                )}
            </div>

            {/* Reply actions */}
            {!isReplying && !isEditing && (
                <button
                    onClick={handleReply}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 
               text-xs font-medium text-blue-600 dark:text-blue-400 cursor-pointer
               bg-blue-50 dark:bg-blue-900/30 
               border border-blue-200 dark:border-blue-800 
               rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 
               transition-all duration-200"
                >
                    <FiMessageSquare className="w-3.5 h-3.5" />
                    Reply
                </button>
            )}


            {isReplying && !isEditing && (
                <div className="mb-3 flex flex-col sm:flex-row gap-2 mt-2">
                    <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="border rounded px-3 py-2 flex-1 text-sm focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                        disabled={postingReply}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddReply}
                            className="bg-blue-500  
                            hover:bg-blue-600 cursor-pointer text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                            disabled={!replyText.trim() || postingReply}
                        >
                            {postingReply ? "Posting..." : "Reply"}
                        </button>
                        <button
                            onClick={() => setIsReplying(false)}
                            // onClick={() => setReplyingToId(null)}
                            className="bg-gray-200 hover:bg-gray-300 cursor-pointer dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white px-3 py-1 rounded text-sm transition-colors"
                            disabled={postingReply}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                        {collapsed ? (
                            <>
                                <FiChevronRight className="w-4 h-4" />
                                <FiMessageCircle className="w-3 h-3" />
                                <span>{comment.replies.length}</span>
                            </>
                        ) : (
                            <>
                                <FiChevronDown className="w-4 h-4" />
                                <FiMessageCircle className="w-3 h-3" />
                                <span>{comment.replies.length}</span>
                            </>
                        )}
                    </button>

                    {!collapsed && (
                        <div className="mt-3 space-y-3">
                            {comment.replies.map((reply) => (
                                <div
                                    key={reply.id}
                                    className="ml-6"
                                    style={{
                                        marginLeft: `${Math.min((depth + 1) * 16, 40)}px`, // keep soft indent
                                    }}
                                >
                                    {/* Floating reply tag */}
                                    <div className="mb-1 text-xs text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1">
                                        <span className="text-gray-400">↪</span>
                                        Reply to{" "}
                                        <span className="text-gray-700 dark:text-gray-200 font-semibold">
                                            {comment.user.fullName}
                                        </span>
                                    </div>

                                    {/* Reply content */}
                                    <div className="bg-white/80 dark:bg-gray-800/60 rounded-lg p-3 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-lg">
                                        <CommentItem
                                            comment={reply}
                                            editingId={editingId}
                                            setEditingId={setEditingId}
                                            // replyingToId={replyingToId}
                                            // setReplyingToId={setReplyingToId}
                                            onDelete={onDelete}
                                            depth={depth + 1}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
};