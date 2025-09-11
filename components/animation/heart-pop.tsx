export function SparkleEffect({ show }: { show: boolean }) {
    if (!show) return null;
    return (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">

            <style jsx>{`
        .animate-sparkle-pop {
          animation: sparkle-pop 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes sparkle-pop {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-10deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.2) rotate(8deg);
          }
          100% {
            opacity: 0;
            transform: scale(1.6) rotate(-8deg);
          }
        }
      `}</style>
        </span>
    );
}