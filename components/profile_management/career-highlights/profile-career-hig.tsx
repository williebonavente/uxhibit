import React from "react";
import { Book, Trophy, Rocket } from "lucide-react";

interface ProfileCareerHighlightsProps {
  highlights: string[];
}

const icons = [<Book size={16} />, <Trophy size={16} />, <Rocket size={16} />];

const ProfileCareerHighlights: React.FC<ProfileCareerHighlightsProps> = ({ highlights }) => (
  <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
    <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white">Career Highlights</h2>
    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-300">
      {highlights.length === 0 ? (
        <li className="italic text-gray-400">No highlights yet.</li>
      ) : (
        highlights.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {icons[i % icons.length]}
            {item}
          </li>
        ))
      )}
    </ul>
  </div>
);

export default ProfileCareerHighlights;