"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Processing() {
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const supabase = createClient();
        const startTime = Date.now();

        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const elapsed = Date.now() - startTime;
                const minDelay = 3000; // 8 seconds
                if (elapsed < minDelay) {
                    setTimeout(() => router.replace("/dashboard"), minDelay - elapsed);
                } else {
                    router.replace("/dashboard");
                }
            } else {
                setTimeout(checkSession, 500);
            }
        };
        checkSession();
    }, [router]);

    // Generate floating particles only once per mount
    const particles = useMemo(() =>
        [...Array(12)].map((_, i) => ({
            width: 16 + Math.random() * 32,
            height: 16 + Math.random() * 32,
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: i * 0.5,
        })), []
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden"
            style={{
                background: "linear-gradient(to right, #19181D, #B22A13, #ED5E20, #FFA600)"
            }}>
            {/* Floating particles */}
            {mounted && particles.map((p, i) => (
                <span
                    key={i}
                    className="absolute rounded-full opacity-30 blur-[2px] pointer-events-none"
                    style={{
                        width: `${p.width}px`,
                        height: `${p.height}px`,
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        background: `radial-gradient(circle, #FFA600 0%, #ED5E20 60%, transparent 100%)`,
                        animation: `floaty 6s ease-in-out infinite`,
                        animationDelay: `${p.delay}s`
                    }}
                />
            ))}


            <div className="mb-8 animate-spin-slow">
                <svg width="80" height="80" viewBox="0 0 256 256" fill="none">
                    <circle cx="128" cy="128" r="120" fill="#fff" className="dark:fill-[#18181b]" />
                    <g>
                        <circle cx="96" cy="72" r="32" fill="#F24E1E" />
                        <circle cx="160" cy="72" r="32" fill="#A259FF" />
                        <circle cx="96" cy="136" r="32" fill="#FF7262" />
                        <circle cx="160" cy="136" r="32" fill="#1ABCFE" />
                        <circle cx="128" cy="104" r="32" fill="#0ACF83" />
                    </g>
                </svg>
            </div>
            {/* Animated Text with gradient and plot twist emoji */}
            <h1 className="text-3xl font-extrabold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] mb-2 tracking-wide [text-shadow:0_1px_0_#ED5E20,0_2px_8px_rgba(0,0,0,0.35)]">
                Unleashing Creativity... <span className="animate-twist inline-block">🌀</span>
            </h1>
            <p className="text-lg text-white/90 dark:text-yellow-200 mb-6">
                Signing you in, please wait
                <span className="inline-block animate-bounce-x">.</span>
                <span className="inline-block animate-bounce-x [animation-delay:0.2s]">.</span>
                <span className="inline-block animate-bounce-x [animation-delay:0.4s]">.</span>
            </p>

            {/* Shimmer bar with fire gradient and sparkles */}
            <div className="w-56 h-3 rounded-full shadow-lg border-2 border-white/30 bg-gradient-to-r from-[#ED5E20] via-[#FFA600] via-60% to-[#fff1c1] animate-shimmer relative overflow-hidden">
                {/* Sparkle overlay */}
                <span className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,#fff8,transparent_70%)] opacity-30 animate-pulse" />
                {/* Extra glow overlay */}
                <span className="absolute inset-0 rounded-full pointer-events-none bg-white/10 blur-[2px]" />
            </div>
            <style jsx global>{`
      @keyframes spin-slow {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg);}
      }
      .animate-spin-slow {
        animation: spin-slow 2.5s linear infinite;
      }
      @keyframes bounce-x {
        0%, 80%, 100% { transform: translateY(0);}
        40% { transform: translateY(-10px);}
      }
      .animate-bounce-x {
        animation: bounce-x 1.2s infinite;
      }
      @keyframes shimmer {
        0% { background-position: -300px 0; }
        100% { background-position: 300px 0; }
      }
      .animate-shimmer {
        background-size: 600px 100%;
        animation: shimmer 2s linear infinite;
      }
      @keyframes gradient-x {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .animate-gradient-x {
        background-size: 200% 200%;
        animation: gradient-x 3s ease-in-out infinite;
      }
      @keyframes twist {
        0%, 100% { transform: rotate(0deg);}
        20% { transform: rotate(20deg);}
        40% { transform: rotate(-20deg);}
        60% { transform: rotate(10deg);}
        80% { transform: rotate(-10deg);}
      }
      .animate-twist {
        animation: twist 2s infinite;
      }
      @keyframes floaty {
        0%, 100% { transform: translateY(0);}
        50% { transform: translateY(-20px);}
      }
    `}</style>
        </div>
    );
}