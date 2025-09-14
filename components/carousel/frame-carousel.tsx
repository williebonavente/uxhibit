import Image from "next/image";
import { useState } from "react";

export function FrameCarousel({ frameImages }: { frameImages: Record<string, string> }) {
  const frameIds = Object.keys(frameImages);
  const [current, setCurrent] = useState(0);

  if (frameIds.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="relative w-full flex items-center justify-center group">
        <Image
          src={frameImages[frameIds[current]]}
          alt={`Frame ${current + 1}`}
          width={360}
          height={220}
          className="rounded-lg object-cover mx-auto shadow-lg border-2 border-green-400/30 transition-all duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold shadow">
            <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 16 16"><rect width="16" height="16" rx="4"/></svg>
            Frame {current + 1} of {frameIds.length}
          </span>
        </div>
      </div>
      {/* Centered dots below the image */}
      <div className="flex justify-center gap-2 mt-4">
        {frameIds.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full border-2 transition-all duration-200
              ${current === idx
                ? "bg-green-500 border-green-600 scale-125 shadow-lg"
                : "bg-gray-300 border-gray-400 opacity-60 hover:scale-110 hover:opacity-90"}
            `}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to frame ${idx + 1}`}
            style={{ outline: "none" }}
          />
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-3">
        <button
          className="px-3 py-1 rounded-full bg-gradient-to-r from-green-200 to-green-400 text-green-900 font-semibold text-xs shadow hover:from-green-300 hover:to-green-500 transition disabled:opacity-40"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          ⬅ Prev
        </button>
        <button
          className="px-3 py-1 rounded-full bg-gradient-to-r from-green-200 to-green-400 text-green-900 font-semibold text-xs shadow hover:from-green-300 hover:to-green-500 transition disabled:opacity-40"
          onClick={() => setCurrent((c) => Math.min(frameIds.length - 1, c + 1))}
          disabled={current === frameIds.length - 1}
        >
          Next ➡
        </button>
      </div>
    </div>
  );
}