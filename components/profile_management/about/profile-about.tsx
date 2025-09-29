"use client";
import React from "react";
import { Pencil, Plus } from "lucide-react";

interface ProfileAboutSectionProps {
  bio: string;
  onEditClick?: () => void;
  editable?: boolean;
  isEmpty?: boolean;
}

const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({
  bio,
  onEditClick,
  editable = false,
  isEmpty = false,
}) => (
  <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md relative">
    <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white flex items-center justify-between">
      About
      {editable && (
        <button
          onClick={onEditClick}
          className="ml-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          title={isEmpty ? "Add About" : "Edit About"}
          aria-label={isEmpty ? "Add About" : "Edit About"}
        >
          {isEmpty ? (
            <Plus size={18} className="text-gray-700 dark:text-gray-200" />
          ) : (
            <Pencil size={18} className="text-gray-700 dark:text-gray-200" />
          )}
        </button>
      )}
    </h2>
    <div
      className="prose prose-lg dark:prose-invert mb-2 break-words"
      dangerouslySetInnerHTML={{ __html: bio }}
    />
  </div>
);

export default ProfileAboutSection;