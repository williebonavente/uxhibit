"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { LoadingButton } from "@/components/loading_props/loading-button";
import BackgroundVideo from "@/components/background_video/backgroundVideo";

export default function Home() {
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);

  const handleButtonClick = async (btn: string, href: string) => {
    setLoadingBtn(btn);
    // Simulate async action (replace with real logic if needed)
    await new Promise((resolve) => setTimeout(resolve, 1200));
    window.location.href = href;
    // setLoadingBtn(null);
  };

return (
  <div className="relative min-h-screen bg-[#0B0B0E] text-white">
    {/* Header */}
    <header className="w-full z-30 fixed top-0 left-0 backdrop-blur-md bg-black/40 border-b border-white/10">
      <div className="w-full mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center justify-between">
        {/* Left: Brand Icon */}
        <Link
          href="/"
          aria-label="Home"
          className="inline-flex items-center shrink-0 hover:scale-105 transition-transform"
        >
          <Image
            src="/images/dark-header-icon.png"
            alt="UXhibit"
            className="w-[102px] h-[42px]"
            width={102}
            height={42}
          />
        </Link>

        {/* Right: Auth Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            className="cursor-pointer w-[110px] sm:w-[120px] h-10 sm:h-11 lg:h-12 inline-flex items-center justify-center rounded-xl font-semibold text-white text-xs sm:text-sm lg:text-base bg-gradient-to-r from-[#FFDB97] via-[#FFA600] to-[#FF8700] shadow-[0_4px_18px_-4px_rgba(237,94,32,0.45)] hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.55)] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 active:scale-[.97]"
            onClick={() => handleButtonClick("login", "/auth/login")}
            disabled={loadingBtn === "login"}
            style={loadingBtn === "login" ? { opacity: 0.7, pointerEvents: "none" } : {}}
          >
            {loadingBtn === "login" ? "Logging in..." : "Log in"}
          </Button>
          <Button
            className="cursor-pointer w-[110px] sm:w-[120px] h-10 sm:h-11 lg:h-12 inline-flex items-center justify-center rounded-xl border border-white/30 text-white font-semibold text-xs sm:text-sm lg:text-base bg-transparent hover:text-[#FF8700] hover:border-[#FF8700] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ED5E20]/40 active:scale-[.97]"
            onClick={() => handleButtonClick("signup", `auth/signup`)}
            disabled={loadingBtn === "signup"}
            style={loadingBtn === "signup" ? { opacity: 0.7, pointerEvents: "none" } : {}}
          >
            {loadingBtn === "signup" ? "Signing up..." : "Sign up"}
          </Button>
        </div>
      </div>
    </header>

    {/* Background video behind everything */}
    <div className="fixed inset-0 -z-10">
      <BackgroundVideo
        src="/images/uxhibit-gif-3(webm).webm"
        type="video/webm"
        overlay={true}
        disabled={true}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />
    </div>

    {/* Main Content */}
    <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full min-h-[calc(100vh-4rem)] pt-24 sm:pt-28 pb-10 px-4 sm:px-6 lg:px-10">
      <div className="w-full mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        {/* Left Column: Image */}
        <div className="flex-1 flex justify-center lg:justify-start max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <Image
            src="/images/uxhibit-icon.png"
            alt="Xhibit Mockup"
            className="w-full max-w-full rounded-xl"
            width={1510}
            height={1508}
            priority
          />
        </div>

        {/* Right Column: Text + CTA */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg sm:max-w-xl">
          {/* Tagline */}
          <span className="uppercase tracking-widest text-[11px] sm:text-xs md:text-sm text-white/80 font-medium mb-3">
            AI-Powered Web Design Evaluation & Learning Tool
          </span>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-5 font-semibold leading-tight bg-gradient-to-r from-[#FFDB97] via-[#FFA600] to-[#FF4D00] bg-clip-text text-transparent">
            Xhibit Your Edge
          </h2>

          {/* Paragraph */}
          <p className="text-sm sm:text-base md:text-lg xl:text-xl mb-8 text-white/80 max-w-xl">
            Build stunning UI/UX designs with smart feedback and usability
            scores. Don&apos;t just showcase your work—prove you understand UX.
          </p>

          {/* CTA */}
          <LoadingButton
            type="button"
            className={`group relative inline-flex items-center justify-center
              w-full sm:w-[220px] h-11 sm:h-12
              rounded-xl text-sm sm:text-base md:text-lg font-semibold tracking-wide
              transition-all duration-300 cursor-pointer
              text-white bg-gradient-to-r from-[#FFDB97] via-[#FFA600] to-[#FF8700]
              shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
              hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
              active:scale-[.97]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 mt-6 sm:mt-8
            `}
            loading={loadingBtn === "getstarted"}
            loadingText="Loading..."
            onClick={() => handleButtonClick("getstarted", "/auth/login")}
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started
            </span>
          </LoadingButton>
        </div>
      </div>
    </main>
  </div>
);
}