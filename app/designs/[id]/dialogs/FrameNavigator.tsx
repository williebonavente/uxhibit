import React from "react";

interface FrameNavigatorProps {
  selectedFrameIndex: number;
  setSelectedFrameIndex: React.Dispatch<React.SetStateAction<number>>;
  sortedFrameEvaluations: any[];
  filteredFrameEvaluations: any[];
}

const FrameNavigator: React.FC<FrameNavigatorProps> = ({
  selectedFrameIndex,
  setSelectedFrameIndex,
  sortedFrameEvaluations,
  filteredFrameEvaluations,
}) => {



  if (sortedFrameEvaluations.length === 0) return null;

  return (

    <div className="flex items-center gap-6 mb-6 justify-center">
      {/* Previous Button */}
      <button
        className={`flex items-center justify-center px-3 py-2 rounded-full font-bold text-lg transition-all duration-200
          bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 shadow
          hover:from-[#ED5E20]/80 hover:to-orange-400/80 hover:text-white hover:shadow-lg hover:scale-110
          focus:outline-none focus:ring-2 focus:ring-[#ED5E20]/40
          ${selectedFrameIndex === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        onClick={() => setSelectedFrameIndex((prev) => Math.max(0, prev - 1))}
        disabled={selectedFrameIndex === 0}
        aria-label="Previous Frame"
        title="Previous Frame"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Frame Info */}
      <span className="text-base font-semibold px-4 py-2 rounded-full bg-white/70 dark:bg-[#232323]/70 shadow border border-[#ED5E20]/10">
        {selectedFrameIndex === 0
          ? "Overall"
          : `Frame ${selectedFrameIndex}`}
        <span className="text-gray-400 ml-2 font-normal">
          ({selectedFrameIndex + 1} / {sortedFrameEvaluations.length})
        </span>
      </span>

      {/* Next Button */}
      <button
        className={`flex items-center justify-center px-3 py-2 rounded-full font-bold text-lg transition-all duration-200
          bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 shadow
          hover:from-[#ED5E20]/80 hover:to-orange-400/80 hover:text-white hover:shadow-lg hover:scale-110
          focus:outline-none focus:ring-2 focus:ring-[#ED5E20]/40
          ${selectedFrameIndex === filteredFrameEvaluations.length - 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        onClick={() =>
          setSelectedFrameIndex((prev) =>
            Math.min(filteredFrameEvaluations.length - 1, prev + 1)
          )
        }
        disabled={selectedFrameIndex === filteredFrameEvaluations.length - 1}
        aria-label="Next Frame"
        title="Next Frame"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

export default FrameNavigator;