import React, { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";


type User = {
    id: string;
    // userProfile: string; later to be implemented
    fullName: string;
    avatarUrl: string;
};

export type Comment = {
    user: User;
    id: string;
    text: string;
    replies?: Comment[];
    createdAt: Date;
    updatedAt?: Date;
    localTime: string,
};

interface CommentItemProps {
    comment: Comment;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    replyingToId: string | null;
    setReplyingToId: (id: string | null) => void;
    onDelete: (id: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    editingId,
    setEditingId,
    replyingToId,
    setReplyingToId,
    onDelete,
}) => {

    const supabase = createClient();

    const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
    const [replyText, setReplyText] = useState("");
    const [editText, setEditText] = useState(comment.text);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const isReplying = replyingToId === comment.id;
    const isEditing = editingId === comment.id;

    const handleEdit = () => {
        setReplyingToId(null);
        setEditingId(comment.id);
    }

    const handleReply = () => {
        setEditingId(null);
        setReplyingToId(comment.id)
    }

    const handleSaveEdit = async () => {
        if (!editText.trim()) {
            toast.error("Comment cannot be empty.");
            return;
        }
        // Update in Supabase
        const { error } = await supabase
            .from("comments")
            .update({
                text: editText,
                updated_at: new Date().toISOString(),
            })
            .eq("id", comment.id);

        if (error) {
            toast.error("Failed to update comment!");
            return;
        }

        // Optionally update local state/UI here if needed
        comment.text = editText;
        comment.updatedAt = new Date();
        setEditingId(null);
        toast.success("Comment updated!");
    }

    const handleCancelEdit = () => {
        setEditingId(null);
    }

    const handleDelete = async () => {
        // Delete from Supabase
        const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", comment.id);

        if (error) {
            toast.error("Failed to delete comment!");
            return;
        }

        toast.info("Comment Deleted!");
        onDelete(comment.id); // Remove from UI state
    };

    const handleAddReply = async () => {
        if (!replyText.trim() || !currentUserId) return;

        // Insert reply into Supabase
        const { data, error } = await supabase
            .from("comments")
            .insert([
                {
                    user_id: currentUserId,
                    text: replyText,
                    parent_id: comment.id,
                    local_time: new Date().toLocaleTimeString(),
                },
            ])
            .select()
            .single();

        if (error) {
            toast.error("Failed to add reply!");
            return;
        }

        // Fetch user profile from Supabase
        const { data: userProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", currentUserId)
            .single();

        const replyToAdd: Comment = {
            id: data.id,
            text: data.text,
            user: {
                id: currentUserId,
                fullName: userProfile?.full_name || "Default User",
                avatarUrl: userProfile?.avatar_url || "/images/default_avatar.png",
            },
            replies: [],
            createdAt: new Date(data.created_at),
            localTime: data.local_time,
        };

        setReplies([replyToAdd, ...replies]);
        setReplyText("");
        setReplyingToId(null);
    };

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id ?? null);
        };
        getUser();
    },);

    console.log("currentUserId:", currentUserId, "commentUserId:", comment.user.id, "isEditing:", isEditing);

    return (

        <div className="border rounded-lg p-3 mb-2">
            {/* Main comment */}
            <div className="flex items-center gap-2 mb-1">
                <Image
                    src={comment.user.avatarUrl || "/images/default_avatar.png"}
                    alt={comment.user.fullName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                />
                <span className="font-semibold">{comment.user.fullName}</span>
                <span className="text-xs text-gray-400 ml-2">
                    {comment.updatedAt
                        ? `Updated at: ${comment.updatedAt.toLocaleDateString()} • ${comment.updatedAt.toLocaleTimeString()}`
                        : `${comment.createdAt.toLocaleDateString()} • ${comment.localTime || new Date(comment.createdAt).toLocaleTimeString()}`}

                </span>

                {/* Edit button */}

                {comment.user.id === currentUserId && !isEditing && (
                    <>
                        <button
                            className="text-xs text-yellow-600 ml-2"
                            onClick={handleEdit}
                        >
                            Edit
                        </button>
                        <button
                            className="text-xs text-red-600 ml-2"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </>

                )}
            </div>
            <div className="ml-10">
                {isEditing ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="border rounded px-2 py-1 flex-1"
                        />
                        <button
                            className="bg-green-500 text-white px-3 py-1 rounded"
                            onClick={handleSaveEdit}
                        >
                            Save
                        </button>
                        <button
                            className="bg-gray-300 text-black px-3 py-1 rounded"
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    comment.text
                )}
            </div>


            {!isReplying && !isEditing && (
                <button
                    className="text-blue-500 text-xs ml-10 mt-1"
                    onClick={handleReply}
                >
                    Reply
                </button>
            )}
            {isReplying && !isEditing && (
                <div className="mb-3 flex gap-2 ml-10 mt-1">
                    <input
                        type="text"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="border rounded px-2 py-1 flex-1"
                    />
                    <button
                        onClick={handleAddReply}
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                        disabled={!replyText.trim()}
                    >
                        Reply
                    </button>
                    <button
                        onClick={() => setReplyingToId(null)}
                        className="bg-gray-300 text-black px-3 py-1 rounded"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Render replies recursively */}
            {replies.length > 0 && (
                <div className="ml-8 mt-2">
                    {replies.map((reply) => (
                        <CommentItem key={reply.id}
                            comment={reply}
                            editingId={editingId}
                            setEditingId={setEditingId}
                            replyingToId={replyingToId}
                            setReplyingToId={setReplyingToId}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};