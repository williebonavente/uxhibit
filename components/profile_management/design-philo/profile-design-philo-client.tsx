"use client";
import { useState } from "react";
import ProfileDesignPhilosophy from "./profile-design-philo";
import { createClient } from "@/utils/supabase/client"; // Adjust path as needed

export default function ProfileDesignPhiloClient({
  designPhilo,
  profileId,
}: {
  designPhilo: string;
  profileId: string;
}) {
  const [value, setValue] = useState(designPhilo);
  const [showEdit, setShowEdit] = useState(false);
  const [editValue, setEditValue] = useState(designPhilo);
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setEditValue(value);
    setShowEdit(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profile_details")
      .update({ design_philo: editValue })
      .eq("profile_id", profileId);
    setLoading(false);
    if (!error) {
      setValue(editValue);
      setShowEdit(false);
    } else {
      alert("Failed to save. Please try again.");
    }
  };

  const handleErase = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profile_details")
      .update({ design_philo: "" })
      .eq("profile_id", profileId);
    setLoading(false);
    if (!error) {
      setValue("");
      setEditValue("");
      setShowEdit(false);
    } else {
      alert("Failed to erase. Please try again.");
    }
  };

  return (
    <>
      <ProfileDesignPhilosophy
        value={value}
        editable={true}
        onEdit={handleEdit}
      />
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl p-6 shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-[#1A1A1A] dark:text-white">
              {value ? "Edit" : "Add"} Design Philosophy
            </h3>
            <textarea
              className="w-full border rounded p-2 mb-4 text-sm text-black dark:text-white bg-gray-50 dark:bg-gray-800"
              rows={4}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <div className="flex justify-between gap-2">
              <button
                onClick={handleErase}
                className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                disabled={loading || !editValue}
              >
                Erase
              </button>
              <div className="flex gap-2">
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
        </div>
      )}
    </>
  );
}