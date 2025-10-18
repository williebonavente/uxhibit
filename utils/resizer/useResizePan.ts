import React from "react";

type UseResizeAndPanOptions = {
  initialSidebarWidth?: number;
  minSidebarWidth?: number;
  maxSidebarWidth?: number;
  zoom?: number;
  onCollapse?: () => void;
};

export default function useResizeAndPan({
  initialSidebarWidth = 700,
  minSidebarWidth = 0,
  maxSidebarWidth = 700,
  zoom = 1,
  onCollapse,
}: UseResizeAndPanOptions) {
  const [sidebarWidth, setSidebarWidth] = React.useState(initialSidebarWidth);
  const [isResizing, setIsResizing] = React.useState(false);

  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const panStart = React.useRef({ x: 0, y: 0 });
  const mouseStart = React.useRef({ x: 0, y: 0 });

  const startResizing = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX - 8;
      setSidebarWidth((prev) =>
        Math.max(minSidebarWidth, Math.min(maxSidebarWidth, newWidth))
      );
      if (newWidth <= 20) onCollapse?.();
    }
    function handleMouseUp() {
      setIsResizing(false);
    }
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minSidebarWidth, maxSidebarWidth, onCollapse]);

  function handlePanStart(e: React.MouseEvent) {
    // keep the same behavior as before
    if (zoom === 1) return;
    setIsPanning(true);
    panStart.current = { ...pan };
    mouseStart.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }

  const handlePanMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - mouseStart.current.x;
      const dy = e.clientY - mouseStart.current.y;
      setPan({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
    },
    [isPanning]
  );

  function handlePanEnd() {
    setIsPanning(false);
  }

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
  }, [isPanning, handlePanMove]);

  React.useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom]);

  return {
    sidebarWidth,
    setSidebarWidth,
    isResizing,
    startResizing,
    pan,
    setPan,
    isPanning,
    handlePanStart,
    handlePanEnd,
    handlePanMove,
  } as const;
}