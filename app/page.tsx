import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="w-full z-20 relative">
        <div className="w-full mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between relative z-20">
          {/* Left: Brand Icon */}
          <Link
            href="/"
            aria-label="Home"
            className="inline-flex items-center shrink-0"
          >
            <img
              src="/images/header-icon.png"
              alt="UXhibit"
              className="block dark:hidden w-[102px] h-[42px]"
            />
            <img
              src="/images/dark-header-icon.png"
              alt="UXhibit (Dark)"
              className="hidden dark:block w-[102px] h-[42px]"
            />
          </Link>

          {/* Right: Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="
                w-full sm:w-[120px] lg:w-[150px] h-12 sm:h-[45px] lg:h-[55px] 
                inline-flex items-center justify-center rounded-xl
                font-semibold text-white text-sm sm:text-base lg:text-lg
                bg-gradient-to-r from-[#FFDB97] via-[#FFA600] to-[#FF8700]
                shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                transition-all duration-300
                focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                active:scale-[.97]
              "
            >
              Log in
            </Link>

            <Link
              href="/auth/signup"
              className="
                w-full sm:w-[120px] lg:w-[150px] h-12 sm:h-[45px] lg:h-[55px] 
                inline-flex items-center justify-center rounded-xl
                border-2 border-[#ED5E20] text-[#ED5E20] font-semibold text-sm sm:text-base lg:text-lg
                bg-transparent
                hover:text-[#FF8700] hover:border-[#FF8700]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ED5E20]/50
                active:scale-[.97]
              "
            >
              Sign up
            </Link>
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
          <source src="/images/landing-page-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/40"></div>{" "}
        {/* optional overlay */}
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center w-full min-h-screen px-4 sm:px-6 lg:px-12 relative z-10 text-white">
        {/* Heading */}
        <h2 className="w-full title-regsiter-login text-4xl sm:text-5xl lg:text-[60px] xl:text-[90px] text-center mb-10">
          Xhibit Your Edge
        </h2>

        {/* Paragraph */}
        <p className="w-full text-base sm:text-lg lg:text-[24px] text-center max-w-4xl mb-10">
          Build stunning <strong>UI/UX</strong> designs with smart feedback and
          usability scores so you don&apos;t just showcase your work, you show
          you know UX.
        </p>

        {/* Get Started Button */}
        <Link
          href="/auth/login"
          className="
            w-full sm:w-[360px] h-12 sm:h-[50px] lg:h-[60px] 
            flex items-center justify-center rounded-xl border-2 lg:border-3 border-[#ED5E20] 
            text-[#ED5E20] font-medium text-lg sm:text-xl lg:text-[25px] leading-[40px] text-center
            bg-transparent transition-all duration-300
            hover:bg-[#ED5E20] hover:text-white hover:border-[#FF8700]
            focus-visible:ring-2 focus-visible:ring-[#ED5E20]/50
            cursor-pointer
          "
        >
          Get Started
        </Link>
      </div>
    </>
  );
}
