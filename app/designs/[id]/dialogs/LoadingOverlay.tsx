import React from "react";

type LoadingOverlayProps = {
  active: boolean;
  loadingEval: boolean;
  backendProgress: number;
};

export function LoadingOverlay({ active, loadingEval, backendProgress }: LoadingOverlayProps) {
  if (!active) return null;

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const tiers: Record<string, string[]> = {
    t0: [
      "Spinning up the vibe engine…",
      "Booting heuristic hamster wheel…",
      "Pixel cauldron preheating 🔥",
      "Assembling UX atoms…",
    ],
    t25: [
      "Blending clarity + chaos 🎨",
      "Marinating accessibility sauce…",
      "Teaching the AI manners 🤖",
      "Refactoring your pixels' aura…",
    ],
    t50: [
      "Mid-cook: tasting the layout stew 👅",
      "Optimizing tap targets fr",
      "Charting cognitive load maps 🗺️",
      "Color contrast glow-up in progress…",
    ],
    t75: [
      "Polishing heuristic halos ✨",
      "Compressing insights into nuggets…",
      "Almost vibed to perfection 😌",
      "Wrapping semantic gifts 🎁",
    ],
    t100: [
      "Finalizing score drop 🔥",
      "Stamping UX passport ✅",
      "Sealing insight scrolls 📜",
      "Deploying vibe report…",
    ],
  };

  const statusText = !loadingEval
    ? "Summoning your frame ✨"
    : backendProgress < 25
    ? pick(tiers.t0)
    : backendProgress < 50
    ? pick(tiers.t25)
    : backendProgress < 75
    ? pick(tiers.t50)
    : backendProgress < 100
    ? pick(tiers.t75)
    : pick(tiers.t100);

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-auto select-none overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes vignettePulse {
          0%,100% { opacity: .6; }
          50% { opacity: .85; }
        }
        @keyframes shineSweep {
          from { transform: translateX(-60%); }
          to { transform: translateX(40%); }
        }
        @keyframes progressStripes {
          from { background-position: 0 0; }
          to { background-position: 32px 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-ok { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="absolute inset-0 bg-white/70 dark:bg-[#0f0f0f]/70 backdrop-blur-sm" />
      <div
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_100%)] anim-ok"
        style={{ animation: "vignettePulse 3.5s ease-in-out infinite" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 anim-ok"
        style={{
          background:
            "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
          animation: "shineSweep 2.2s linear infinite",
        }}
      />

      <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
        <div className="relative w-[min(92vw,560px)] rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md shadow-xl ring-1 ring-black/5 dark:ring-white/5 p-6">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center justify-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full bg-[#ED5E20] shadow-[0_0_0_3px_rgba(237,94,32,0.15)] anim-ok"
                style={{ animation: "vignettePulse 2s ease-in-out infinite" }}
              />
              <span className="text-lg md:text-xl font-semibold text-neutral-800 dark:text-neutral-100 drop-shadow-[0_1px_0_rgba(0,0,0,.25)]">
                {statusText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}