"use client";
import { useState, useEffect, useRef } from "react";
import ProfileAboutSection from "./profile-about";
import { createClient } from "@/utils/supabase/client";
import RichTextEditor from "@/components/rich-editor/rich-text-editor";

export default function ProfileAboutSectionClient({
  bio,
  profileId,
}: {
  bio: string;
  profileId: string;
}) {
  const [value, setValue] = useState(bio);
  const [showEdit, setShowEdit] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const editorRef = useRef(null);

  const supabase = createClient();

  // Reset editValue when opening the modal
  const handleEdit = () => {
    setEditValue(value || "");
    setShowEdit(true);
    setError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profile_details")
      .update({ about: editValue })
      .eq("profile_id", profileId);
    setLoading(false);
    if (!error) {
      setValue(editValue);
      setShowEdit(false);
    } else {
      setError("Failed to save. Please try again.");
    }
  };

  const handleErase = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profile_details")
      .update({ about: "" })
      .eq("profile_id", profileId);
    setLoading(false);
    if (!error) {
      setValue("");
      setEditValue("");
      setShowEdit(false);
    } else {
      setError("Failed to erase. Please try again.");
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowEdit(false);
    };
    if (showEdit) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEdit]);

  useEffect(() => {
    if (showEdit && editorRef.current) {
      setTimeout(() => {
        editorRef.current?.commands.focus();
      }, 100);
    }
  }, [showEdit]);

  useEffect(() => {
  async function checkOwner() {
    const { data: { user } } = await supabase.auth.getUser();

    // Use maybeSingle to avoid error if no row exists
    const { data: profileDetails, error } = await supabase
      .from("profile_details")
      .select("profile_id")
      .eq("profile_id", profileId)
      .maybeSingle();

    const ownerCheck = Boolean(user && profileDetails && user.id === profileDetails.profile_id);
    setIsOwner(ownerCheck);

    // Log as requested
    console.log("isOwner:", ownerCheck);
    console.log("contact:", null); // You can replace null with actual contact data if available
    console.log("isEditing:", false); // Or use your state if you have one
  }
  checkOwner();
}, [profileId, supabase]);

  return (
    <>
      <ProfileAboutSection
        bio={value}
        editable={isOwner}
        isEmpty={!value}
        onEditClick={handleEdit}
      />
      <div
        style={{ display: showEdit ? "block" : "none" }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-8 shadow-2xl w-full max-w-lg mx-auto border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-bold mb-6 text-[#1A1A1A] dark:text-white">
            {value ? "Edit" : "Add"} About
          </h3>
          <RichTextEditor
            ref={editorRef}
            value={editValue}
            onChange={setEditValue}
            disabled={loading}
            className="min-h-[700px] max-h-[500px] overflow-auto w-full max-w-2xl mx-auto rounded-lg bg-white dark:bg-[#1A1A1A]"
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
          <hr className="my-6 border-gray-200 dark:border-gray-700" />
          <div className="flex justify-between gap-2">
            <button
              onClick={handleErase}
              className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium cursor-pointer"
              disabled={loading || !editValue}
            >
              Erase
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium cursor-pointer"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-[#ED5E20] text-white hover:bg-[#d94e13] transition font-medium cursor-pointer"
                disabled={loading || !editValue}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}