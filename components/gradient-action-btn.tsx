"use client";

import React, { forwardRef } from "react";

export type GradientActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  size?: "sm" | "md" | "lg"; 
  fullWidth?: boolean;        
  minWidth?: number;         
};

export const GradientActionButton = forwardRef<HTMLButtonElement, GradientActionButtonProps>(
  ({ loading = false, loadingText = "Working…", className = "", children, disabled, size = "md", fullWidth = false, minWidth, ...props }, ref) => {
    const isDisabled = disabled || loading;

    const sizeClasses =
      size === "sm"
        ? "h-10 text-xs rounded-lg"
        : size === "lg"
        ? "h-12 text-sm rounded-xl"
        : "h-11 text-sm rounded-lg"; // md

    const widthClasses = fullWidth ? "w-full" : ""; 

    const minWidthStyle = minWidth ? { minWidth } : undefined;

    return (
      <button
        ref={ref}
        aria-busy={loading || undefined}
        disabled={isDisabled}
        style={minWidthStyle}
        className={[
          "cursor-pointer relative inline-flex items-center justify-center overflow-hidden",
          sizeClasses,
          widthClasses,
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 group/button",
          isDisabled
            ? "font-medium border border-neutral-300/70 dark:border-neutral-600/60 bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-200 shadow-sm backdrop-blur cursor-not-allowed opacity-90"
            : "text-white font-semibold tracking-wide",
          className,
        ].join(" ")}
        {...props}
      >
        {isDisabled ? (
          <span className="relative z-10">{loading ? loadingText : children}</span>
        ) : (
          <>
            <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b] transition-transform duration-300 group-hover:scale-105" />
            <span aria-hidden className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06))] backdrop-blur-[2px]" />
            <span aria-hidden className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover/button:translate-x-[220%] group-hover/button:opacity-70" />
            <span className="relative z-10 flex items-center gap-2">{children}</span>
          </>
        )}
      </button>
    );
  }
);

GradientActionButton.displayName = "GradientActionButton";