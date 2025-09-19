"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function ProcessingPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const startTime = Date.now();
    const minDelay = 8000; // 8 seconds

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(minDelay - elapsed, 0);
        setTimeout(() => router.replace("/dashboard"), delay);
      } else {
        setTimeout(() => checkSession(), 500);
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center w-full overflow-hidden p-5">
      {/* Fullscreen Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/images/uxhibit-gif-3(webm).webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Centered Processing Card */}
      <div className="flex flex-col items-center justify-center text-center py-24 animate-pulse relative z-10">
        <Image
          src="/images/figma-logo.svg"
          alt="Connecting to Figma illustration"
          height={150}
          width={150}
          className="object-contain mb-6"
          priority
        />
        <h2 className="text-lg font-semibold text-[#ED5E20] mb-2">
          Connecting to Figma
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Signing you in, please wait.
        </p>
      </div>
    </div>
  );
}