import React from "react";
import { IconZoomIn, IconZoomOut, IconEyeOff, IconEye } from "@tabler/icons-react";

interface ZoomControlsProps {
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    pan: { x: number; y: number };
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, setZoom, setPan, pan }) => {
    const [hidden, setHidden] = React.useState(false);

    return (
        <>
            {/* Controls Panel */}
            <div
                className={`absolute top-4 right-4 z-30 flex gap-2 bg-white/70 dark:bg-[#232323]/70 rounded shadow px-2 py-1
                    transition-all duration-500 ease-out
                    ${hidden
                        ? "opacity-0 scale-50 blur-sm pointer-events-none translate-y-8 translate-x-8"
                        : "opacity-100 scale-100 blur-0 pointer-events-auto translate-y-0 translate-x-0"
                    }`}
                style={{ backdropFilter: "blur(4px)", transformOrigin: "90% 10%" }} // Origin near the eye icon
            >
                <button
                    onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
                    className="p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900 transition cursor-pointer"
                    aria-label="Zoom In"
                    disabled={zoom >= 3}
                    title="Zoom In"
                >
                    <IconZoomIn size={20} />
                </button>
                <button
                    onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
                    className="p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900 transition cursor-pointer"
                    aria-label="Zoom Out"
                    disabled={zoom <= 0.5}
                    title="Zoom Out"
                >
                    <IconZoomOut size={20} />
                </button>
                <button
                    onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                    }}
                    className="p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900 transition cursor-pointer"
                    aria-label="Reset Zoom"
                    disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                    title="Reset Zoom"
                >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <path d="M12 4v1m0 14v1m8-8h-1M5 12H4m13.07-6.07l-.71.71M6.34 17.66l-.71.71m12.02 0l-.71-.71M6.34 6.34l-.71-.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
                <span className="text-xs font-semibold px-2 mt-1">{Math.round(zoom * 100)}%</span>
                <button
                    onClick={() => setHidden(true)}
                    className="p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900 transition cursor-pointer"
                    aria-label="Hide Controls"
                    title="Hide Controls"
                >
                    <IconEyeOff size={20} />
                </button>
            </div>
            {/* Reveal Eye Button */}
            <button
                onClick={() => setHidden(false)}
                className={`absolute top-4 right-4 z-40 bg-white/80 dark:bg-[#232323]/80 rounded-full shadow p-2 cursor-pointer
                    transition-all duration-500 ease-out
                    ${hidden
                        ? "opacity-100 scale-100 translate-y-0 translate-x-0"
                        : "opacity-0 scale-50 pointer-events-none translate-y-8 translate-x-8"
                    }`}
                aria-label="Show Controls"
                title="Show Controls"
                style={{ backdropFilter: "blur(4px)" }}
            >
                <IconEye size={20} />
            </button>
        </>
    );
};

export default ZoomControls;