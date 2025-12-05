"use client";

import { useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";

type MakePublicHelpProps = {
    title: string;
    headerDescription: string;
    description: string;
  videoSrc?: string; 
};

export default function MakePublicHelp({
  videoSrc,
  headerDescription,
  description,
  title
}: MakePublicHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#ED5E20]/5 transition-colors"
        aria-expanded={open}
        aria-controls="make-public-panel"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {headerDescription}
            </p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        id="make-public-panel"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4">
          <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40">
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <div className="absolute inset-0">
                <video src={videoSrc} controls className="w-full h-full" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>
            {description} 
            </p>
            </div>
        </div>
      </div>
    </div>
  );
}