"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link as LinkIcon, Image as ImageIcon, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface ReEvaluatePanelProps {
  reEvalUrl: string;
  setReEvalUrl: (v: string) => void;
  reEvalImages: File[];
  setReEvalImages: (v: File[]) => void;
  loadingEval: boolean;
  reEvalUploading: boolean;
  onRun: () => void;
  onCancel: () => void;
  title?: string;
  renderActions?: (ctx: {
    loadingEval: boolean;
    reEvalUploading: boolean;
    canRun: boolean;
    reason?: string;
    onRun: () => void;
    onCancel: () => void;
  }) => React.ReactNode;
  maxImages?: number;
}

const FIGMA_FILE_URL_REGEX =
  /^https:\/\/www\.figma\.com\/(file|design)\/[A-Za-z0-9]{10,}\/?/i;

export function ReEvaluatePanel({
  reEvalUrl,
  setReEvalUrl,
  reEvalImages,
  setReEvalImages,
  loadingEval,
  reEvalUploading,
  onRun,
  onCancel,
  title = "Re-Evaluate Options",
  renderActions,
  maxImages = 10,
}: ReEvaluatePanelProps) {
  const [mode, setMode] = useState<"link" | "images">("link");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // pagination for images
  const PAGE_SIZE = 5;
  const [start, setStart] = useState(0);
  const end = Math.min(start + PAGE_SIZE, reEvalImages.length);
  const canPaginate = reEvalImages.length > PAGE_SIZE;

  const hasLink = reEvalUrl.trim().length > 0;
  const validLink = hasLink
    ? FIGMA_FILE_URL_REGEX.test(reEvalUrl.trim())
    : false;
  const hasImages = reEvalImages.length > 0;

  let canRun = true;
  let reason: string | undefined;

  if (loadingEval || reEvalUploading) {
    canRun = false;
    reason = "In progress…";
  } else if (mode === "link") {
    if (!hasLink) {
      canRun = false;
      reason = "Enter a Figma link.";
    } else if (!validLink) {
      canRun = false;
      reason = "Invalid Figma link format.";
    }
  } else if (mode === "images") {
    if (!hasImages) {
      canRun = false;
      reason = "Upload at least one image.";
    }
  }

  const removeImage = (idx: number) => {
    setReEvalImages(reEvalImages.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

    useEffect(() => {
    // clamp start when images change (e.g., after deletes)
    if (start > Math.max(0, reEvalImages.length - PAGE_SIZE)) {
      setStart(Math.max(0, reEvalImages.length - PAGE_SIZE));
    }
  }, [reEvalImages.length, start]);

  const prevPage = () => setStart((s) => Math.max(0, s - PAGE_SIZE));
  const nextPage = () =>
    setStart((s) => Math.min(Math.max(0, reEvalImages.length - PAGE_SIZE), s + PAGE_SIZE));

  // ...existing code (validation, handleFiles, removeImage, etc.)...
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const list = Array.from(files).slice(0, maxImages - reEvalImages.length);
      if (!list.length) {
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      setReEvalImages([...reEvalImages, ...list]);
      if (inputRef.current) inputRef.current.value = "";
      // jump to last page when new images are added
      setStart((_) => Math.max(0, Math.min(reEvalImages.length, reEvalImages.length + list.length - PAGE_SIZE)));
    },
    [reEvalImages, setReEvalImages, maxImages]
  );

  return (
    <div className="mb-4 rounded-xl border border-neutral-300 dark:border-neutral-700 p-6 bg-white/85 dark:bg-neutral-900/70 space-y-5 shadow-sm">
      {/* Mode toggle */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border cursor-pointer transition
            ${
              mode === "link"
                ? "bg-[#ED5E20] text-white border-[#ED5E20]"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
        >
          <LinkIcon className="h-5 w-5" />
          Link
        </button>
        <button
          type="button"
          onClick={() => setMode("images")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border cursor-pointer transition
            ${
              mode === "images"
                ? "bg-[#ED5E20] text-white border-[#ED5E20]"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
        >
          <ImageIcon className="h-5 w-5" />
          Images
        </button>
      </div>

      {mode === "link" && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 justify-between">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Paste a Figma Design Link
            </span>
            {hasLink && (
              <span
                className={`text-xs ml-auto ${
                  validLink
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-500"
                }`}
              >
                {validLink ? "Valid" : "Invalid"}
              </span>
            )}
          </label>

          <div
            className={`relative flex items-center rounded-xl border-2 bg-white dark:bg-neutral-800 transition-shadow ${
              hasLink
                ? validLink
                  ? "border-emerald-400 dark:border-emerald-500"
                  : "border-rose-400 dark:border-rose-500"
                : "border-neutral-300 dark:border-neutral-600"
            } focus-within:ring-4 focus-within:ring-[#ED5E20]/30`}
          >
            <span className="pl-4 pr-2 text-neutral-500 dark:text-neutral-400">
              <LinkIcon className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="https://www.figma.com/design/..."
              className="w-full pr-4 py-3 text-base sm:text-sm bg-transparent outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
              value={reEvalUrl}
              onChange={(e) => setReEvalUrl(e.target.value)}
            />
          </div>
        </div>
      )}

      {mode === "images" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Upload Frame Images
            </label>
            {reEvalImages.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="text-xs px-2.5 py-1.5 rounded-md border
                    bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200
                    dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50 dark:active:bg-rose-900/70
                    border-rose-200 dark:border-rose-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    Clear ({reEvalImages.length})
                  </button>
                </AlertDialogTrigger>

                <AlertDialogContent
                  className="z-[190]" /* higher than modal z-[100] */
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear uploaded images?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all frames. You can upload again
                      afterward.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border border-neutral-300 dark:border-neutral-700 cursor-pointer">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => setReEvalImages([])}
                      className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      Yes, clear all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center gap-3 p-6 min-h-[160px] border-2 border-dashed rounded-xl text-sm
              ${
                dragActive
                  ? "border-[#ED5E20] bg-orange-50/50 dark:bg-[#302519]"
                  : "border-neutral-300 dark:border-neutral-600 bg-neutral-50/70 dark:bg-neutral-800/40"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <p className="text-neutral-700 dark:text-neutral-300">
              Drag & drop or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="underline text-[#ED5E20] hover:text-[#d95015] cursor-pointer"
              >
                browse
              </button>
              .
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Up to {maxImages} images. First image is primary.
            </p>
          </div>
          {reEvalImages.length > 0 && (
            <>
              {/* <= 5 images: simple grid */}
              {reEvalImages.length <= PAGE_SIZE ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {reEvalImages.map((f, i) => {
                    const objectUrl = URL.createObjectURL(f);
                    return (
                      <div
                        key={i}
                        className="relative group rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
                      >
                        <img
                          src={objectUrl}
                          alt={f.name}
                          className="h-24 w-full object-cover"
                          onLoad={() => URL.revokeObjectURL(objectUrl)}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded px-1 text-[10px] opacity-0 group-hover:opacity-100 transition"
                          aria-label="Remove image"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-1">
                          <span className="text-[10px] text-white truncate block">
                            {f.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // > 5 images: paginated view with chevrons
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Showing {start + 1} - {end} of {reEvalImages.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={prevPage}
                        disabled={!canPaginate || start === 0}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 cursor-pointer"
                        aria-label="Previous"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextPage}
                        disabled={!canPaginate || end >= reEvalImages.length}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 cursor-pointer"
                        aria-label="Next"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {reEvalImages.slice(start, end).map((f, i) => {
                      const realIndex = start + i;
                      const objectUrl = URL.createObjectURL(f);
                      return (
                        <div
                          key={realIndex}
                          className="relative group rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
                        >
                          <img
                            src={objectUrl}
                            alt={f.name}
                            className="h-24 w-full object-cover"
                            onLoad={() => URL.revokeObjectURL(objectUrl)}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(realIndex)}
                            className="cursor-pointer absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded px-1 text-[10px] opacity-0 group-hover:opacity-100 transition"
                            aria-label="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {renderActions ? (
        renderActions({
          loadingEval,
          reEvalUploading,
          canRun,
          reason,
          onRun,
          onCancel,
        })
      ) : (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={loadingEval}
            onClick={onCancel}
            className="h-10 min-w-[130px] px-4 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canRun}
            onClick={onRun}
            className={`h-10 min-w-[130px] px-4 text-xs rounded-md text-white cursor-pointer transition ${
              canRun
                ? "bg-[#ED5E20] hover:bg-[#d95015]"
                : "bg-neutral-400 dark:bg-neutral-700 cursor-not-allowed"
            }`}
          >
            {loadingEval
              ? "Evaluating..."
              : reEvalUploading
              ? "Uploading..."
              : "Run Evaluation"}
          </button>
          {!canRun && reason && (
            <span className="ml-2 text-[11px] text-rose-600 dark:text-rose-400">
              {reason}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
