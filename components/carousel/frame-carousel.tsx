import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function FrameCarousel({ frameImages }: { frameImages: Record<string, string> }) {
  const frameIds = Object.keys(frameImages);
  const [current, setCurrent] = useState(0);

  if (frameIds.length === 0) return null;

  return (
    <div>
      <div className="relative w-full flex items-center justify-center group">
        <Image
          src={frameImages[frameIds[current]]}
          alt={`Frame ${current + 1}`}
          width={360}
          height={220}
          className="rounded-lg object-cover mx-auto"
        />
      </div>

      <div className="flex items-center justify-between mt-5 mb-5 w-[400px] max-w-xl mx-auto px-4 bg-[#ED5E20]/5 rounded-full p-3">
        {/* Left Arrow */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#ED5E20]/10 hover:bg-[#ED5E20]/20 text-[#ED5E20] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:scale-120"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          aria-label="Previous frame"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Frame Counter */}
        <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
          Frame {String(current + 1).padStart(2, "0")} / {frameIds.length}
        </span>

        {/* Right Arrow */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#ED5E20]/10 hover:bg-[#ED5E20]/20 text-[#ED5E20] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:scale-120"
          onClick={() => setCurrent((c) => Math.min(frameIds.length - 1, c + 1))}
          disabled={current === frameIds.length - 1}
          aria-label="Next frame"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}