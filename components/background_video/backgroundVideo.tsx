"use client";
import React from "react";

type BackgroundVideoProps = {
  src?: string;
  type?: string;
  poster?: string;
  className?: string;
  overlay?: boolean;
  overlayClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  disabled?: boolean; 
};

export default function BackgroundVideo({
  src = "/images/uxhibit-gif-3(webm).webm",
  type = "video/webm",
  poster,
  className = "",
  overlay = true,
  overlayClassName = "",
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  disabled = false,
}: BackgroundVideoProps) {
  if (disabled) return null;

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden -z-10 ${className}`} aria-hidden>
      <video
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        poster={poster}
        className="w-full h-full object-cover"
      >
        <source src={src} type={type} />
        Your browser does not support the video tag.
      </video>

      {overlay && <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent ${overlayClassName}`} />}
    </div>
  );
}