import React from "react";
import { CommentItem, Comment } from "@/components/comments-user";
import { FiMessageSquare } from "react-icons/fi";

interface CommentsSectionProps {
    comments: Comment[];
    newCommentText: string;
    setNewCommentText: (text: string) => void;
    currentUserId: string | null;
    handleAddComment: (text?: string) => void;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    replyingToId: string | null;
    setReplyingToId: (id: string | null) => void;
    handleDeleteComment: (id: string) => void;
    postingComment: boolean;
    handleAddReply: (parentId: string, replyText: string) => Promise<void>
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
    comments,
    newCommentText,
    setNewCommentText,
    currentUserId,
    handleAddComment,
    editingId,
    setEditingId,
    // replyingToId,
    // setReplyingToId,
    handleDeleteComment,
    handleAddReply,
    postingComment
}) => {
    console.log("Comment section props.comments: ", comments);
    
    return (
    <div className="mb-6">
        {/* Input Area */}
        <div className="flex items-center gap-2 mb-4 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm focus-within:shadow-md transition">
            <input
                type="text"
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                placeholder={currentUserId ? "💬 Write a comment..." : "Login to comment"}
                className="w-full rounded-lg px-4 py-2 text-base bg-gray-100 dark:bg-gray-700 
                            text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 
                            focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                disabled={!currentUserId}
            />
           
            <button
                onClick={() => {
                    console.log("Post clicked, text: ", newCommentText);
                    handleAddComment(newCommentText);
                }}
                type="button"
                disabled={!newCommentText.trim() || !currentUserId}
                className="cursor-pointer flex items-center gap-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg shadow transition"
            >
                {postingComment ? (
                    <>
                        <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Posting...
                    </>
                ) : (
                    <span>Post</span>
                )}
            </button>
        </div>

        {/* Comment List */}
        <div className="space-y-3">
            {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                    <FiMessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                        No comments yet. <br /> Be the first to start the conversation 🚀
                    </p>
                </div>

            ) : (
                comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        handleAddReply={handleAddReply}
                        onDelete={handleDeleteComment}
                    />
                ))
            )}
        </div>
    </div>
    );
};