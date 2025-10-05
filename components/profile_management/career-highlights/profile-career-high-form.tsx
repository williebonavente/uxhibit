import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Highlight } from "./profile-career-high";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import {
  Book,
  Trophy,
  Rocket,
  Star,
  Medal,
  Flame,
  Sparkles,
  Lightbulb,
  Heart,
  ThumbsUp,
  PartyPopper,
  Gem,
  Mountain,
  Globe,
  Dumbbell,
  Brain,
  Sun,
  Moon,
} from "lucide-react";

const iconOptions = [
  { value: "book", icon: <Book size={18} /> },
  { value: "trophy", icon: <Trophy size={18} /> },
  { value: "rocket", icon: <Rocket size={18} /> },
  { value: "star", icon: <Star size={18} /> },
  { value: "medal", icon: <Medal size={18} /> },
  { value: "fire", icon: <Flame size={18} /> },
  { value: "sparkles", icon: <Sparkles size={18} /> },
  { value: "lightbulb", icon: <Lightbulb size={18} /> },
  { value: "heart", icon: <Heart size={18} /> },
  { value: "thumbsup", icon: <ThumbsUp size={18} /> },
  { value: "diamond", icon: <Gem size={18} /> },
  { value: "mountain", icon: <Mountain size={18} /> },
  { value: "globe", icon: <Globe size={18} /> },
  { value: "muscle", icon: <Dumbbell size={18} /> },
  { value: "brain", icon: <Brain size={18} /> },
  { value: "sun", icon: <Sun size={18} /> },
  { value: "moon", icon: <Moon size={18} /> },
];

interface ProfileCareerHighFormProps {
  initialHighlights: Highlight[];
  onSave: (highlights: Highlight[]) => void;
  profileDetailsId: string;
  onCancel: () => void;
}

const ProfileCareerHighForm: React.FC<ProfileCareerHighFormProps> = ({
  initialHighlights,
  onSave,
  onCancel,
  profileDetailsId,
}) => {
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [formErrors, setFormErrors] = useState<number[]>([]);
  const supabase = createClient();
  function handleChange(idx: number, key: keyof Highlight, value: string) {
    setHighlights((h) =>
      h.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  }

  function handleDelete(idx: number) {
    setHighlights((h) => h.filter((_, i) => i !== idx));
  }

  function handleAdd() {
    setHighlights((h) => [...h, { icon: "star", content: "" }]);
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validate: check for empty content fields
    const errorIndices = highlights
      .map((item, idx) => (item.content.trim() === "" ? idx : -1))
      .filter((idx) => idx !== -1);
    setFormErrors(errorIndices);
    if (errorIndices.length > 0) {
      return;
    }
    if (!profileDetailsId) {
      console.error("profileDetailsId is missing!");
      return;
    }
    await saveHighlightsToDB(profileDetailsId, highlights);
    onSave(highlights);
  }

  async function saveHighlightsToDB(
    profileDetailsId: string,
    highlights: Highlight[]
  ) {
    const highlightsArray = highlights.map((h) => JSON.stringify(h));

    // Choose the filter key: "id" or "profile_id"
    const filterKey = "profile_id";

    // Check if the row exists
    const { data: rows, error: selectError } = await supabase
      .from("profile_details")
      .select("id, profile_id, career_highlights")
      .eq(filterKey, profileDetailsId);

    if (selectError) {
      console.error("Supabase select error:", selectError);
      return false;
    }

    if (!rows || rows.length === 0) {
      console.error(
        `No row found with ${filterKey} = ${profileDetailsId}. Cannot update highlights.`
      );
      return false;
    }

    // Attempt to update the highlights
    const { data, error, status } = await supabase
      .from("profile_details")
      .update({ career_highlights: highlightsArray })
      .eq(filterKey, profileDetailsId)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return false;
    }

    if (!data || data.length === 0 || status === 204) {
      console.error(
        "No rows were updated. Possible reasons: row does not exist or RLS policy blocked the update."
      );
      return false;
    }

    // console.log("Update successful. Updated rows:", data);
    return true;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
      onClick={onCancel}
    >
      <div
        className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-xl
                   p-6 sm:p-8 md:p-10 bg-white dark:bg-[#1A1A1A]
                   rounded-2xl shadow-xl border border-white/20 cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-6">
                    Manage Career Highlights
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Highlights list */}
                    <div className="overflow-y-auto max-h-64 rounded-xl">
                        <table className="w-full text-sm sm:text-base border-separate border-spacing-y-3 pr-2">
                            <tbody>
                                {highlights.map((item, idx) => (
                                    <tr
                                        key={idx}
                                        className="bg-gray-50 dark:bg-accent rounded-xl transition shadow-md"
                                    >
                                        <td className="pl-3 pr-3 py-2 rounded-xl">
                                            <div className="flex items-center justify-between gap-3">
                                                {/* Icon select */}
                                                <Select
                                                    value={item.icon}
                                                    onValueChange={value => handleChange(idx, "icon", value)}
                                                    defaultValue={item.icon}
                                                >
                                                    <SelectTrigger
                                                        className="border rounded-lg px-3 py-2 w-[120px] cursor-pointer"
                                                        aria-label="Icon"
                                                    >
                                                        <SelectValue placeholder="Choose icon" />
                                                    </SelectTrigger>

                                                    <SelectContent className="z-[300]" position="popper">
                                                        {iconOptions.map(icon => (
                                                            <SelectItem key={icon} value={icon}>
                                                                {icon}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {/* Description input */}
                                                <Input
                                                    type="text"
                                                    value={item.content}
                                                    onChange={e => handleChange(idx, "content", e.target.value)}
                                                    placeholder="Highlight description"
                                                    className="border rounded-lg px-3 py-2 flex-1"
                                                />

                                                {/* Delete button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(idx)}
                                                    className="p-2"
                                                    aria-label="Delete highlight"
                                                >
                                                    <Trash2
                                                        size={18}
                                                        className="text-gray-500 hover:text-red-600 cursor-pointer transition"
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {/* Add highlight button */}
                                <tr>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            onClick={handleAdd}
                                            className="w-full h-11 flex items-center justify-center rounded-xl 
                                            border border-[#ED5E20]/50 dark:border-[#ED5E20]/25 
                                            text-[#ED5E20] hover:bg-[#ED5E20]/20 dark:hover:bg-[#ED5E20]/10  
                                            transition cursor-pointer"
                                            aria-label="Add Highlight"
                                        >
                                            +
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>



                    {/* Cancel / Save buttons */}
                    <div className="flex gap-4 mt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            aria-label="Close"
                            className="flex-1 inline-flex items-center justify-center rounded-xl text-sm font-medium
                         border border-neutral-300/70 dark:border-neutral-600/60
                         bg-white/70 dark:bg-neutral-800/70
                         text-neutral-700 dark:text-neutral-200
                         shadow-sm backdrop-blur
                         hover:bg-neutral-100 dark:hover:bg-neutral-700
                         transition-colors h-12 cursor-pointer"
                        >
                          <SelectTrigger
                            className="border rounded-lg px-3 py-2 w-full cursor-pointer"
                            aria-label="Icon"
                          >
                            <SelectValue placeholder="Choose icon" />
                          </SelectTrigger>

                          <SelectContent className="z-[300]" position="popper">
                            {iconOptions.map((opt, i) => (
                              <SelectItem
                                key={`${opt.value}-${i}`}
                                value={opt.value}
                              >
                                <div className="flex items-center gap-2">
                                  {opt.icon}
                                  <span className="capitalize">
                                    {opt.value}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Description input */}
                        <Input
                          type="text"
                          value={item.content}
                          onChange={(e) => {
                            handleChange(idx, "content", e.target.value);
                            if (
                              formErrors.includes(idx) &&
                              e.target.value.trim() !== ""
                            ) {
                              // remove error dynamically when user fixes it
                              setFormErrors((prev) =>
                                prev.filter((i) => i !== idx)
                              );
                            }
                          }}
                          placeholder="Highlight description"
                          className={`border rounded-lg px-3 py-2 w-full ${
                            formErrors.includes(idx)
                              ? "border-red-500 focus:ring-red-500"
                              : ""
                          }`}
                        />

                        {formErrors.includes(idx) && (
                          <p className="text-red-500 text-xs text-left w-full">
                            Please fill out this field.
                          </p>
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(idx)}
                          className="pt-2"
                          aria-label="Delete highlight"
                        >
                          <Trash2
                            size={18}
                            className="text-gray-500 hover:text-red-600 cursor-pointer transition"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Add highlight button */}
                <tr>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={handleAdd}
                      className="w-full mb-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2
            text-[#ED5E20] border border-dashed border-[#ED5E20]/50 hover:bg-[#ED5E20]/10 transition cursor-pointer"
                      aria-label="Add Highlight"
                    >
                      <Plus size={18} /> Add Career Highlight
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 inline-flex items-center justify-center rounded-xl text-sm font-medium
              border border-neutral-300/70 dark:border-neutral-600/60
              bg-white/70 dark:bg-neutral-800/70
              text-neutral-700 dark:text-neutral-200
              shadow-sm backdrop-blur
              hover:bg-neutral-100 dark:hover:bg-neutral-700
              transition-colors h-12 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="relative flex-1 inline-flex items-center justify-center
              rounded-xl text-sm text-white font-semibold tracking-wide
              transition-all duration-300 h-12 overflow-hidden
              focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
              cursor-pointer group/button"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
              />
              <span
                aria-hidden
                className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06))] backdrop-blur-[2px]"
              />
              <span
                aria-hidden
                className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 -left-full w-1/2
                  bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0
                  transition-all duration-700 group-hover/button:translate-x-[220%] group-hover/button:opacity-70"
                />
              </span>
              <span className="relative z-10">Save All</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCareerHighForm;
