"use client";
import React from "react";
import { Pencil, Plus } from "lucide-react";
import "../../rich-editor/rich-text-editor.css";

interface ProfileDesignPhilosophyProps {
  value: string;
  editable?: boolean;
  onEdit?: () => void;
  isEmpty?: boolean;
}

const ProfileDesignPhilosophy: React.FC<ProfileDesignPhilosophyProps> = ({
  value,
  editable = false,
  onEdit,
  isEmpty, // optional
}) => {
  // Automatically detect if the value is empty
  const empty = isEmpty ?? (!value || value.trim() === "");

  return (
    <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md relative group break-words">
      <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white flex items-center gap-2">
        Design Philosophy
      </h2>

      {editable && (
        <button
          onClick={onEdit}
          className="absolute top-5 right-5 p-2 cursor-pointer flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title={empty ? "Add Design Philosophy" : "Edit Design Philosophy"}
          aria-label={empty ? "Add Design Philosophy" : "Edit Design Philosophy"}
        >
          {empty ? <Plus size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white" /> : <Pencil size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white" />}
        </button>
      )}

      {empty ? (
        <p className="italic text-gray-400 text-sm">Share your design philosophy!</p>
      ) : (
        <div
          className="prose prose-lg dark:prose-invert mb-2 break-words text-gray-500 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      )}
    </div>
  );
};

export default ProfileDesignPhilosophy;
