import { Button } from "@/components/ui/button";
import React from "react";

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  loading,
  loadingText = "Loading...",
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      style={loading ? { opacity: 0.7, pointerEvents: "none" } : {}}
      {...props}
    >
      {loading ? (
        <span className="relative z-10">{loadingText}</span>
      ) : (
        children
      )}
      {/* Decorative layers for gradient/glass effect */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
      />
      <span
        aria-hidden
        className="absolute inset-[2px] rounded-[10px] 
          bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))]
          backdrop-blur-[2px]"
      />
      <span
        aria-hidden
        className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
      >
        <span
          className="absolute inset-y-0 -left-full w-1/2 translate-x-0 
            bg-gradient-to-r from-transparent via-white/50 to-transparent
            opacity-0 transition-all duration-700
            group-hover:translate-x-[220%] group-hover:opacity-70"
        />
      </span>
      <span
        aria-hidden
        className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
      />
    </Button>
  );
}