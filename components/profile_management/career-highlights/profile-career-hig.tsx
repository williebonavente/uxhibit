import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import ProfileCareerHighForm from "./profile-career-high-form";
import { createClient } from "@/utils/supabase/client";

// Highlight type now supports icon choice
export type Highlight = {
  icon:
  | "book"
  | "trophy"
  | "rocket"
  | "star"
  | "medal"
  | "fire"
  | "sparkles"
  | "lightbulb"
  | "heart"
  | "clap"
  | "thumbsup"
  | "party"
  | "diamond"
  | "mountain"
  | "globe"
  | "fireworks"
  | "muscle"
  | "brain"
  | "sun"
  | "moon";
  content: string; // HTML string
};

interface ProfileCareerHighlightsProps {
  highlights: Highlight[];
  editable?: boolean;
  onAddHighlight?: () => void;
  onEditHighlight?: (index: number) => void;
  onDeleteHighlight?: (index: number) => void;
  profileDetailsId: string;
}


const iconMap: Record<Highlight["icon"], React.ReactElement> = {
  book: <>📚</>,
  trophy: <>🏆</>,
  rocket: <>🚀</>,
  star: <>⭐</>,
  medal: <>🥇</>,
  fire: <>🔥</>,
  sparkles: <>✨</>,
  lightbulb: <>💡</>,
  heart: <>❤️</>,
  clap: <>👏</>,
  thumbsup: <>👍</>,
  party: <>🎉</>,
  diamond: <>💎</>,
  mountain: <>⛰️</>,
  globe: <>🌍</>,
  fireworks: <>🎆</>,
  muscle: <>💪</>,
  brain: <>🧠</>,
  sun: <>🌞</>,
  moon: <>🌙</>,
};

const MAX_DISPLAY = 13;

const ProfileCareerHighlights: React.FC<ProfileCareerHighlightsProps> = ({
  highlights,
  editable = false,
  profileDetailsId
}) => {
  const [showAll, setShowAll] = useState(false);
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [highlightsState, setHighlightsState] = useState<Highlight[]>(highlights);
  const [isOwner, setIsOwner] = useState(false);

  const displayed = showAll ? highlightsState : highlightsState.slice(0, MAX_DISPLAY);

  const supabase = createClient();

  useEffect(() => {
    async function checkOwner() {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: profileDetails } = await supabase
        .from("profile_details")
        .select("profile_id")
        .eq("profile_id", profileDetailsId)
        .single();

      const ownerCheck = Boolean(user && profileDetails && user.id === profileDetails.profile_id);
      setIsOwner(ownerCheck);
    }
    checkOwner();
  }, [profileDetailsId, supabase]);

  return (
    <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md relative">
      <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white flex items-center gap-2">
        Career Highlights
        <span
          className="text-xs text-gray-400 cursor-help"
          title="Showcase your proudest achievements!"
        >
          ?
        </span>
      </h2>
      {isOwner && editable && !isEditingAll && (
        <button
          onClick={() => setIsEditingAll(true)}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors cursor-pointer flex items-center gap-2"
          title="Edit All Highlights"
          aria-label="Edit All Highlights"
        >
          <Pencil size={18} className="text-orange-400" />
        </button>
      )}
      {isEditingAll ? (
        <ProfileCareerHighForm
          initialHighlights={highlightsState}
          profileDetailsId={profileDetailsId}
          onSave={newHighlights => {
            setHighlightsState(newHighlights);
            setIsEditingAll(false);
            // Optionally: save to backend here
          }}
          onCancel={() => setIsEditingAll(false)}
        />
      ) : (
        <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-300">
          {highlightsState.length === 0 ? (
            <li className="italic text-gray-400">No highlights yet.</li>
          ) : (
            displayed.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition group"
              >
                <span className="transition-transform group-hover:scale-110">
                  {iconMap[item.icon]}
                </span>
                <span
                  className="prose prose-sm dark:prose-invert flex-1"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </li>
            ))
          )}
        </ul>
      )}
      {highlightsState.length > MAX_DISPLAY && !isEditingAll && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs text-[#ED5E20] hover:underline"
        >
          {showAll ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
};


export default ProfileCareerHighlights;