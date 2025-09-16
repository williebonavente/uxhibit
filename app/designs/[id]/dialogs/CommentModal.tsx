import React from "react";
import { MessageSquare } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner/index";
import { Comment } from "@/components/comments-user";


interface CommentModalProps {
  open: boolean;
  onClose: () => void;
  comments: Comment[];
  loading: boolean;
  markCommentAsRead: (id: string) => Promise<void>;
  markCommentAsUnread: (id: string) => Promise<void>;

}

const CommentModal: React.FC<CommentModalProps> = ({ 
  open, 
  onClose, 
  comments, 
  loading,
  markCommentAsRead,
  markCommentAsUnread

}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#232323] rounded-xl shadow-2xl p-8 min-w-[350px] max-w-[90vw] relative">
        <button
          className="absolute top-3 right-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold mb-4 text-[#ED5E20] flex items-center gap-2">
          <MessageSquare size={20} /> Latest Comment
        </h3>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner className="w-8 h-8 text-[#ED5E20] animate-spin mb-2" />
            <span className="text-[#ED5E20] font-medium animate-pulse">Loading comments...</span>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-2">
            <div className={`p-4 rounded-lg ${!comments[0].is_read ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400" : "bg-[#ED5E20]/10"}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="text-base text-neutral-800 dark:text-neutral-200">
                  {comments[0].text}
                </div>
                {!comments[0].is_read && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-400 text-white font-semibold">
                    Unread
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>By {comments[0].user.fullName || "Anonymous"}</span>
                <span>{new Date(comments[0].createdAt).toLocaleString()}</span>
              </div>
              <button
                className="mt-2 text-xs underline text-[#ED5E20] hover:text-[#c94a0f]"
                onClick={async () => {
                  // Toggle read/unread status
                  // You must implement this function
                  //  in the parent and pass it as a prop, or use a mutation here
                  if (comments[0].is_read) {
                    // Mark as unread
                    await markCommentAsUnread(comments[0].id);
                  } else {
                    // Mark as read
                    await markCommentAsRead(comments[0].id);
                  }
                }}
              >
                Mark as {comments[0].is_read ? "Unread" : "Read"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <MessageSquare size={40} className="text-[#ED5E20] mb-2" />
            <span className="text-gray-500 text-center font-medium">
              No comments yet.<br />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentModal;