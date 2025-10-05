"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { LoadingButton } from "@/components/loading_props/loading-button";

export default function Home() {
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);

  const handleButtonClick = async (btn: string, href: string) => {
    setLoadingBtn(btn);
    // Simulate async action (replace with real logic if needed)
    await new Promise((resolve) => setTimeout(resolve, 1200));
    window.location.href = href;
    // setLoadingBtn(null);
  };

  useEffect(() => {
    fetch("/api/ux_averages")
      .then(res => res.json())
      .then(data => {
        console.log("Average UX Ratings:", data);
      });
  }, []);
  return (
    <>
      {/* Header */}
      <header className="w-full z-30 fixed top-0 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="w-full mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between relative z-20">
          {/* Left: Brand Icon */}
          <Link
            href="/"
            aria-label="Home"
            className="inline-flex items-center shrink-0 hover:scale-105 transition-transform"
          >
            <Image
              src="/images/dark-header-icon.png"
              alt="UXhibit (Dark)"
              className="w-[102px] h-[42px]"
              width={102}
              height={42}
            />
          </Link>
          {/* Right: Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button
              className="cursor-pointer w-full sm:w-[100px] lg:w-[120px] h-12 sm:h-[40px] lg:h-[50px] inline-flex items-center justify-center rounded-xl font-semibold text-white text-sm sm:text-base lg:text-lg bg-gradient-to-r from-[#FFDB97] via-[#FFA600] to-[#FF8700] shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)] hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 active:scale-[.97]"
              onClick={() => handleButtonClick("login", "/auth/login")}
              disabled={loadingBtn === "login"}
              style={loadingBtn === "login" ? { opacity: 0.7, pointerEvents: "none" } : {}}
            >
              {loadingBtn === "login" ? "Logging in..." : "Log in"}
            </Button>
            <Button
              className="cursor-pointer w-full sm:w-[100px] lg:w-[120px] h-12 sm:h-[40px] lg:h-[50px] inline-flex items-center justify-center rounded-xl border-2 border-white text-white font-semibold text-sm sm:text-base lg:text-lg bg-transparent hover:text-[#FF8700] hover:border-[#FF8700] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ED5E20]/50 active:scale-[.97]"
              onClick={() => handleButtonClick("signup", "/auth/signup")}
              disabled={loadingBtn === "signup"}
              style={loadingBtn === "signup" ? { opacity: 0.7, pointerEvents: "none" } : {}}
            >
              {loadingBtn === "signup" ? "Signing up..." : "Sign up"}
            </Button>
          </div>
        </div>
      </header>

      {/* Background Video */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/images/uxhibit-gif-3(webm).webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        {/* gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row items-center justify-center w-full min-h-screen px-4 sm:px-6 lg:px-12 gap-15 relative z-10 text-white">
        {/* Left Column: Image */}
        <div className="flex-1 flex justify-center lg:justify-start max-w-md sm:max-w-lg lg:max-w-xl">
          <Image
            src="/images/uxhibit-icon.png"
            alt="Xhibit Mockup"
            className="w-full rounded-xl"
            width={1510}
            height={1508}
          />
        </div>

        {/* Right Column: Text + CTA */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg sm:max-w-xl lg:max-w-2xl">
          {/* Tagline */}
          <span className="uppercase tracking-widest text-xs sm:text-sm lg:text-base text-white/90 font-light mb-3">
            AI-Powered Web Design Evaluation & Learning Tool
          </span>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl mb-6 font-medium leading-tight bg-gradient-to-r from-[#FFDB97] via-[#FFA600] to-[#FF4D00] bg-clip-text text-transparent drop-shadow-lg">
            Xhibit Your Edge
          </h2>

          {/* Paragraph */}
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl mb-8 text-gray-200 w-full">
            Build stunning UI/UX designs with smart feedback and usability
            scores. Don&apos;t just showcase your work—prove you understand UX.
          </p>

          {/* CTA */}
          <LoadingButton
            type="button"
            className={`group relative inline-flex items-center justify-center
              w-full sm:w-[200px] h-25 lg:h-[50px]
              rounded-xl text-lg font-semibold tracking-wide
              transition-all duration-300 cursor-pointer
              text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
              hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
              active:scale-[.97]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 mt-10
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
      </main>
    </>
  );
}