import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Highlight } from "./profile-career-hig";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";


const iconOptions: Highlight["icon"][] = [
    "book", "trophy", "rocket", "star", "medal", "fire", "sparkles", "lightbulb",
    "heart", "clap", "thumbsup", "party", "diamond", "mountain", "globe",
    "fireworks", "muscle", "brain", "sun", "moon"
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
    profileDetailsId
}) => {
    const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
    const supabase = createClient();
    function handleChange(idx: number, key: keyof Highlight, value: string) {
        setHighlights(h =>
            h.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
        );
    }

    function handleDelete(idx: number) {
        setHighlights(h => h.filter((_, i) => i !== idx));
    }

    function handleAdd() {
        setHighlights(h => [...h, { icon: "star", content: "" }]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!profileDetailsId) {
            console.error("profileDetailsId is missing!");
            return;
        }
        await saveHighlightsToDB(profileDetailsId, highlights);
        onSave(highlights);
    }

    async function saveHighlightsToDB(profileDetailsId: string, highlights: Highlight[]) {
        const highlightsArray = highlights.map(h => JSON.stringify(h));

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
            console.error(`No row found with ${filterKey} = ${profileDetailsId}. Cannot update highlights.`);
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
            console.error("No rows were updated. Possible reasons: row does not exist or RLS policy blocked the update.");
            return false;
        }

        // console.log("Update successful. Updated rows:", data);
        return true;
    }

   


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4">
                <h2 className="text-xl font-semibold mb-6 text-[#ED5E20] dark:text-orange-300 text-center">
                    Career Highlights
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {highlights.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <Select
                                value={item.icon}
                                onValueChange={value => handleChange(idx, "icon", value)}
                            >
                                <SelectTrigger className=" border rounded p-2"
                                    style={{ width: "120px" }}
                                    aria-label="Icon">
                                    <SelectValue placeholder="Choose icon" />
                                </SelectTrigger>
                                <SelectContent>
                                    {iconOptions.map(icon => (
                                        <SelectItem key={icon} value={icon}>
                                            {icon}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="text"
                                value={item.content}
                                onChange={e => handleChange(idx, "content", e.target.value)}
                                placeholder="Highlight description"
                                className="border rounded p-2 flex-1"
                            />
                            <button
                                type="button"
                                className="text-red-400 px-2"
                                onClick={() => handleDelete(idx)}
                                aria-label="Delete highlight"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="text-orange-400 underline"
                        onClick={handleAdd}
                    >
                        + Add Highlight
                    </button>
                    <div className="flex gap-2 justify-end mt-4">
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-orange-400 text-white font-semibold hover:bg-orange-500 transition cursor-pointer"
                        >
                            Save All
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileCareerHighForm;