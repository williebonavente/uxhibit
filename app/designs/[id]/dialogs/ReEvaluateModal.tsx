"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ReEvaluatePanel, ReEvaluatePanelProps } from "./ReEvaluatePanel";
import { GradientActionButton } from "@/components/gradient-action-btn";

export interface ReEvaluateModalProps extends ReEvaluatePanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function ReEvaluateModal({
  open,
  onClose,
  title = "Re-Evaluation",
  ...panelProps
}: ReEvaluateModalProps) {

    const { reEvalImages, reEvalUrl, reEvalUploading } = panelProps;
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        containerRef.current
          ?.querySelector<HTMLElement>("button, input, [tabindex]")
          ?.focus();
      }, 10);
    }
  }, [open]);

    const prevUploadingRef = useRef<boolean>(false);
      useEffect(() => {
    const startedUploading = !prevUploadingRef.current && reEvalUploading;
    const hasContent = panelProps.reEvalImages.length > 0 || panelProps.reEvalUrl.trim().length > 0;
    if (startedUploading && hasContent && open) {
      onClose();
    }
    prevUploadingRef.current = reEvalUploading;
  }, [reEvalUploading, panelProps.reEvalImages.length, panelProps.reEvalUrl, open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="re-eval-modal-title"
      data-modal-root
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-3xl mx-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
          <div className="space-y-1 pr-4">
            <h2
              id="re-eval-modal-title"
              className="text-2xl sm:text-3xl font-bold gradient-text leading-tight"
            >
              {title}
            </h2>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {reEvalImages.length > 0 || reEvalUrl.trim().length > 0
                ? "You have uploaded updated frames / link. Re-run to assess improvements versus the previous evaluation."
                : "Provide either a Figma link or upload frame images to run a new evaluation."}
              <span className="block mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                Note: Re-uploaded frames replace earlier ones for comparison.
              </span>
            </p> 
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content scroll area */}
        <div className="px-6 pb-6 pt-4 overflow-y-auto max-h-[70vh] custom-scroll">
          <ReEvaluatePanel
            {...panelProps}
            title="Options"
            renderActions={({
              loadingEval,
              reEvalUploading,
              canRun,
              reason,
              onRun,
              onCancel,
            }) => (
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={loadingEval}
                  onClick={onCancel}
                  className="cursor-pointer h-11 min-w-[130px] px-4 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <GradientActionButton
                  size="md"
                  fullWidth={false}
                  minWidth={130}
                  loading={loadingEval || reEvalUploading}
                  loadingText={reEvalUploading ? "Uploading..." : "Evaluating..."}
                  disabled={!canRun}
                  onClick={() => {
                    // close immediately on run. Comment out if you prefer closing after upload completes.
                    onClose();
                    onRun();
                  }}
                  className="px-4"
                >
                  {canRun ? "Run Evaluation" : reason || "Run Evaluation"}
                </GradientActionButton>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
