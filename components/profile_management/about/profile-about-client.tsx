"use client";
import { useState, useEffect, useRef } from "react";
import ProfileAboutSection from "./profile-about";
import { createClient } from "@/utils/supabase/client";
import RichTextEditor from "@/components/rich-editor/rich-text-editor";
import { Eraser, Redo2, Undo2 } from "lucide-react";

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
      const { data: profileDetails } = await supabase
        .from("profile_details")
        .select("profile_id")
        .eq("profile_id", profileId)
        .maybeSingle();

      const ownerCheck = Boolean(user && profileDetails && user.id === profileDetails.profile_id);
      setIsOwner(ownerCheck);

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
      {showEdit && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowEdit(false)}
        >
          {/* Card */}
          <div
            className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-3xl 
                     p-6 sm:p-8 md:p-10 bg-white dark:bg-[#1A1A1A] 
                     rounded-2xl shadow-xl border border-white/20 text-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-6">
              {value ? "Edit About" : "Add About"}
            </h3>

            {/* Editor */}
            <RichTextEditor
              ref={editorRef}
              value={editValue}
              onChange={setEditValue}
              disabled={loading}
              className="overflow-hidden w-full rounded-lg 
                       bg-white dark:bg-[#1A1A1A] text-left"
            />

            {error && (
              <p className="text-red-500 text-sm mt-3">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex justify-between items-center w-full mt-4">
              {/* Left controls */}
              <div className="flex gap-2">
                {/* Undo */}
                <button
                  onClick={() => editorRef.current?.commands.undo()}
                  disabled={loading}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl
                             border border-neutral-300/70 dark:border-neutral-600/60 
                             bg-white/60 dark:bg-neutral-800/50
                             text-neutral-700 dark:text-neutral-200
                             shadow-sm backdrop-blur
                             hover:bg-white/80 dark:hover:bg-neutral-800/70
                             transition-colors cursor-pointer"
                  title="Undo"
                >
                  <Undo2 size={18} />
                </button>

                {/* Redo */}
                <button
                  onClick={() => editorRef.current?.commands.redo()}
                  disabled={loading}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl
                             border border-neutral-300/70 dark:border-neutral-600/60 
                             bg-white/60 dark:bg-neutral-800/50
                             text-neutral-700 dark:text-neutral-200
                             shadow-sm backdrop-blur
                             hover:bg-white/80 dark:hover:bg-neutral-800/70
                             transition-colors cursor-pointer"
                  title="Redo"
                >
                  <Redo2 size={18} />
                </button>
              </div>

              {/* Right controls */}
              <div className="flex gap-3">
                {/* Clear */}
                <button
                  onClick={handleErase}
                  disabled={loading || !editValue}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl
                             border border-neutral-300/70 dark:border-neutral-600/60 
                             bg-white/60 dark:bg-neutral-800/50
                             text-neutral-700 dark:text-neutral-200
                             shadow-sm backdrop-blur
                             hover:bg-white/80 dark:hover:bg-neutral-800/70
                             transition-colors cursor-pointer"
                  title="Clear"
                >
                  <Eraser size={18} />
                </button>

                {/* Cancel */}
                <button
                  onClick={() => setShowEdit(false)}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-medium
                            border border-neutral-300/70 dark:border-neutral-600/60 
                            bg-white/60 dark:bg-neutral-800/50
                            text-neutral-700 dark:text-neutral-200
                            shadow-sm backdrop-blur
                            hover:bg-white/80 dark:hover:bg-neutral-800/70
                            transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={loading || !editValue}
                  className="group relative inline-flex items-center justify-center
                            px-6 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                            transition-all duration-300 cursor-pointer
                            focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px]"
                  />
                  <span
                    aria-hidden
                    className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                  >
                    <span className="absolute inset-y-0 -left-full w-1/2 translate-x-0 
                         bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 
                         transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
                  />
                  <span className="relative z-10">
                    {loading ? "Saving..." : "Save"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}