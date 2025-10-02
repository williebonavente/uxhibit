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
}) => {
  return (
    <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md relative">
      <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white flex items-center gap-2">
        About
      </h2>

      {editable && (
        <button
          onClick={onEditClick}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors cursor-pointer flex items-center gap-2"
          title={isEmpty ? "Add About" : "Edit About"}
          aria-label={isEmpty ? "Add About" : "Edit About"}
        >
          {isEmpty ? (
            <Plus size={18} className="text-orange-400" />
          ) : (
            <Pencil size={18} className="text-orange-400" />
          )}
        </button>
      )}

      {isEmpty ? (
        <p className="italic text-gray-400 text-sm">No about yet.</p>
      ) : (
        <div
          className="prose prose-lg dark:prose-invert mb-2 break-words text-gray-500 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: bio }}
        />
      )}
    </div>
  );
};

export default ProfileAboutSection;