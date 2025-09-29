import React from "react";
import { Pencil, Plus } from "lucide-react";
import "../../rich-editor/rich-text-editor.css"

interface ProfileDesignPhilosophyProps {
  value: string;
  editable?: boolean;
  onEdit?: () => void;
}

const ProfileDesignPhilosophy: React.FC<ProfileDesignPhilosophyProps> = ({
  value,
  editable = false,
  onEdit,
}) => {
  return (
    <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md break-words">
      <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white flex items-center justify-between">
        Design Philosophy
        {editable && (
          <button
            onClick={onEdit}
            className="ml-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title={value ? "Edit Design Philosophy" : "Add Design Philosophy"}
            aria-label={value ? "Edit Design Philosophy" : "Add Design Philosophy"}
          >
            {value ? (
              <Pencil size={18} className="text-gray-700 dark:text-gray-200" />
            ) : (
              <Plus size={18} className="text-gray-700 dark:text-gray-200" />
            )}
          </button>
        )}
      </h2>
      <div
        className="prose prose-lg dark:prose-invert mb-2 break-words"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}

export default ProfileDesignPhilosophy;