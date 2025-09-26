"use client";
import { createClient } from "@/utils/supabase/client"; // Adjust import path as needed
import ProfileAboutSection from "./profile-about";
import { useState } from "react";

export default function ProfileAboutSectionClient({ bio, profileId }: { bio: string; profileId: string }) {
  const [showEdit, setShowEdit] = useState(false);
  const [editValue, setEditValue] = useState(bio);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profile_details")
      .update({ about: editValue })
      .eq("profile_id", profileId);

    setLoading(false);

    if (!error) {
      setShowEdit(false);
      // Update local state for instant UI feedback
      // (editValue is already set, so nothing else needed)
    } else {
      alert("Failed to save. Please try again.");
    }
  };

  return (
    <>
      <ProfileAboutSection
        bio={editValue}
        editable={true}
        isEmpty={!editValue}
        onEditClick={() => setShowEdit(true)}
      />
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl p-6 shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-[#1A1A1A] dark:text-white">Edit About</h3>
            <textarea
              className="w-full border rounded p-2 mb-4 text-sm text-black dark:text-white bg-gray-50 dark:bg-gray-800"
              rows={4}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEdit(false)}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 rounded bg-[#ED5E20] text-white hover:bg-[#d94e13] transition"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}