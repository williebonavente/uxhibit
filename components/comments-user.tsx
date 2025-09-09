import React from "react";
import Image from "next/image";

type User = {
  id: string;
  userProfile: string;
  fullName: string;
  avatarUrl: string;
};

type Comment = {
  user: User;
  id: string;
  text: string;
  replies?: Comment[];
  createdAt: Date;
};

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => (
  <div className="border rounded-lg p-3 mb-2">
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
        {comment.createdAt.toLocaleDateString()}
      </span>
    </div>
    <div className="ml-10">{comment.text}</div>
    {/* Render replies recursively if needed */}
    {comment.replies && comment.replies.length > 0 && (
      <div className="ml-8 mt-2">
        {comment.replies.map((reply) => (
          <CommentItem key={reply.id} comment={reply} />
        ))}
      </div>
    )}
  </div>
);