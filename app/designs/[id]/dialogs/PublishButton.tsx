import React from "react";

interface PublishButtonProps {
  isActive: boolean;
  publishProject: () => Promise<void>;
  unpublishProject: () => Promise<void>;
  syncPublishedState: () => Promise<void>;
}

const PublishButton: React.FC<PublishButtonProps> = ({
  isActive,
  publishProject,
  unpublishProject,
  syncPublishedState,
}) => {
  return isActive ? (
    <button
      onClick={async () => {
        await unpublishProject();
        await syncPublishedState();
      }}
      className="flex items-center gap-2 bg-gray-300 text-gray-700 
        px-8 py-2 rounded-xl font-semibold shadow-md hover:bg-gray-400 
        transition-all duration-200 text-sm focus:outline-none 
        focus:ring-2 focus:ring-[#ED5E20]/40 cursor-pointer"
    >
      <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="9" fill="#6B7280" fillOpacity="0.18" />
        <path d="M6 6l8 8M14 6l-8 8" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Unpublish
    </button>
  ) : (
    <button
      onClick={async () => {
        await publishProject();
        await syncPublishedState();
      }}
      className="flex items-center gap-2 bg-gradient-to-r from-[#ED5E20] 
        to-orange-400 text-white px-8 py-2 rounded-xl font-semibold shadow-md 
        hover:from-orange-500 hover:to-[#ED5E20] transition-all duration-200 
        text-sm focus:outline-none focus:ring-2 focus:ring-[#ED5E20]/40 animate-pulse cursor-pointer"
    >
      <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="9" fill="#fff" fillOpacity="0.18" />
        <path d="M6 10.5l2.5 2.5L14 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Publish
    </button>
  );
};

export default PublishButton;