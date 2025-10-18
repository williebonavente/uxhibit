import React from "react";

type UseBodyPanEffectsOpts = {
  isResizing?: boolean;
  isPanning: boolean;
  handlePanMove: (e: MouseEvent) => void;
  handlePanEnd: () => void;
  zoom: number;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
};

/**
 * Small hook to manage global body cursor/userSelect and pan event listeners.
 * Copy-paste ready — call from page.tsx after you get the values from useResizeAndPan.
 */
export default function useBodyPanEffects({
  isResizing,
  isPanning,
  handlePanMove,
  handlePanEnd,
  zoom,
  setPan,
}: UseBodyPanEffectsOpts) {
  React.useEffect(() => {
    document.body.style.userSelect = isResizing ? "col-resize" : "";
    return () => {
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  React.useEffect(() => {
    if (isPanning) {
      document.body.style.cursor = "grab";
      document.addEventListener("mousemove", handlePanMove);
      document.addEventListener("mouseup", handlePanEnd);
    } else {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handlePanMove);
      document.removeEventListener("mouseup", handlePanEnd);
    }
    return () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handlePanMove);
      document.removeEventListener("mouseup", handlePanEnd);
    };
  }, [isPanning, handlePanMove, handlePanEnd]);

  React.useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom, setPan]);
}