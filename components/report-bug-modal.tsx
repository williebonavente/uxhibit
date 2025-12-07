import { useEffect, useRef, useState } from "react";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type User = {
  avatarUrl: string;
  fullName: string;
};

type ReportBugModalProps = {
  open: boolean;
  onClose: () => void;
  user: User | null;
  imageUrls?: string[];
};

async function uploadBugImages(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const supabase = createClient();
  const urls: string[] = [];

  for (const f of files) {
    const name = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${f.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage
      .from("bug-screenshots")
      .upload(name, f, { contentType: f.type || "image/png" });

    if (error) continue;

    const { data: pub } = supabase.storage
      .from("bug-screenshots")
      .getPublicUrl(name);
    if (pub?.publicUrl) urls.push(pub.publicUrl);
  }
  return urls;
}

export function ReportBugModal({
  open,
  onClose,
  user,
  imageUrls = [],
}: ReportBugModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);

  const GITHUB_ISSUE_URL =
    "https://github.com/williebonavente/uxhibit/issues/new";

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        modalRef.current?.querySelector("input")?.focus();
      }, 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleTab = (e: KeyboardEvent) => {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        "input, textarea, button"
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const lines: string[] = [];

    // Explicit section for description
    lines.push("### Description");
    lines.push(body.trim() || "_No description provided._");
    lines.push("");

    // Attaching image
    let screenshotUrls: string[] = [];
    try {
      screenshotUrls = await uploadBugImages(localFiles);
    } catch (err) {
      console.error("Failed to upload screenshots:", err);
    }

    const allImageUrls = [...imageUrls, ...screenshotUrls];

    if (allImageUrls.length) {
      lines.push("### Screenshots / Attachments", "");
      allImageUrls.forEach((url, idx) => {
        lines.push(`![Attachment ${idx + 1}](${url})`);
      });
      lines.push("");
    }

    if (user) {
      lines.push("### Reporter");
      lines.push(`- Name: ${user.fullName}`);
      lines.push("");
    }
    if (typeof window !== "undefined") {
      lines.push("### Environment");
      lines.push(`- URL: ${window.location.href}`);
      lines.push("");
    }

    const fullBody = lines.join("\n");

    const params = new URLSearchParams({
      title: title,
      body: fullBody,
      labels: "bug",
    });

    window.open(
      `${GITHUB_ISSUE_URL}?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );

    setTitle("");
    setBody("");
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Blurred, darkened background */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centered form */}
      <div
        ref={modalRef}
        className="relative z-[201] bg-white dark:bg-[#141414] rounded-2xl shadow-2xl 
             w-full max-w-2xl sm:max-w-3xl p-6 sm:p-8 
             overflow-y-auto max-h-[95vh] 
             flex flex-col items-stretch border border-black/5 dark:border-white/10"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex flex-col">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <FaGithub className="text-gray-700 dark:text-gray-200" />
              Report a Bug or Request a Feature
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This will open a pre-filled GitHub issue in a new tab.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-700 mb-4" />

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="text-green-600 text-2xl mb-2">✔️</span>
            <p className="text-center font-semibold mb-1">
              Thank you for the report!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Redirecting you to GitHub to finalize the issue…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Title
              </label>
              <input
                className="border rounded-md px-3 py-2 w-full text-base focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-150 focus:border-blue-500 hover:border-blue-400 bg-white dark:bg-[#1b1b1b]"
                placeholder="Short summary (e.g. 'Crash when uploading image')"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                What happened?
              </label>
              <textarea
                className="border rounded-md px-3 py-2 w-full min-h-[120px] text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-150 focus:border-blue-500 hover:border-blue-400 resize-y bg-white dark:bg-[#1b1b1b]"
                placeholder={
                  "Steps to reproduce, what you expected, and what you saw.\n" +
                  "You can also paste links or image URLs here."
                }
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Tip: Include URLs, screenshots, or design IDs so we can
                reproduce the issue quickly.
              </p>
            </div>

            {/* Screenshots (for the record) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Screenshots (optional)
              </label>
              <label
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-gray-300 
               dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 cursor-pointer 
               hover:bg-gray-50 dark:hover:bg-[#1f1f1f] transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Click to upload or drag images here</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;

                    setLocalFiles((prev) => [...prev, ...files]);

                    const previews = files.map((file) =>
                      URL.createObjectURL(file)
                    );
                    setLocalPreviews((prev) => [...prev, ...previews]);
                  }}
                />
              </label>

              {localPreviews.length > 0 && (
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {localPreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative w-full aspect-video rounded-md overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 inline-flex items-center justify-center 
                                 w-6 h-6 rounded-full bg-black/60 text-white hover:bg-black/80 
                                 text-xs cursor-pointer"
                        onClick={() => {
                          setLocalFiles((prev) =>
                            prev.filter((_, i) => i !== idx)
                          );
                          setLocalPreviews((prev) =>
                            prev.filter((_, i) => i !== idx)
                          );
                        }}
                        aria-label="Remove screenshot"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                For now, images are only used as visual reference in this
                dialog. You can still paste permanent image links into the
                description so they appear in GitHub.
              </p>
            </div>

            {/* Footer actions */}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                A new GitHub tab will open with your details filled in.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-all duration-150 hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 cursor-pointer"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md bg-blue-600 text-white text-sm flex items-center gap-2 shadow transition-all duration-150 hover:bg-blue-700 active:scale-95 ${
                    !title.trim() || !body.trim()
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  disabled={!title.trim() || !body.trim()}
                  title="Submit directly to GitHub Issues"
                >
                  <FaGithub className="text-base" />
                  <span>Continue on GitHub</span>
                </button>
              </div>
            </div>
            {/* Direct link to GitHub template (no autofill) */}
            <button
              type="button"
              className="self-end text-[11px] text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              onClick={() => {
                window.open(GITHUB_ISSUE_URL, "_blank", "noopener,noreferrer");
              }}
            >
              Open blank issue on GitHub instead
            </button>
          </form>
        )}
      </div>
      <style>{`
      .backdrop-blur-sm {
        backdrop-filter: blur(8px);
      }
    `}</style>
    </div>
  );
}
