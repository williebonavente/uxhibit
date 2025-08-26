import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <header className="w-full">
        <div className="mx-auto max-w-[1920px] px-4 lg:px-12 py-4 flex items-center justify-between">
          {/* Left: brand icon */}
          <Link
            href="/"
            aria-label="Home"
            className="inline-flex items-center shrink-0"
          >
            <Image
              src="/images/header-icon.png"
              alt="UXhibit"
              width={102}
              height={42}
              className="block dark:hidden"
              priority
            />
            <Image
              src="/images/dark-header-icon.png"
              alt="UXhibit (Dark)"
              width={102}
              height={42}
              className="hidden dark:block"
              priority
            />
          </Link>

          {/* Right: auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="h-[44px] min-w-8 px-5 inline-flex items-center justify-center rounded-[10px]
                            font-[Poppins] text-[16px] font-semibold text-white
                            bg-[linear-gradient(90deg,#FFDB97,#FFA600,#FF8700,#FF4D00)]
                            transition-[background,box-shadow,color] duration-200 ease-linear
                            hover:shadow-[0_0_5px_0.5px_#FFA600] hover:text-white
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8700]
                            active:opacity-90"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="h-[44px] px-5 inline-flex items-center justify-center rounded-[10px]
                             border-[2px] border-[#ED5E20] text-[#ED5E20] font-[Poppins] text-[16px] font-semibold
                            bg-transparent transition-colors duration-200
                            hover:text-[#FF8700] hover:border-[#FF8700]
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8700]
                            active:opacity-90"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <div className="relative w-full min-h-screen max-w-[1920px] max-h-[1080px] mx-auto overflow-hidden">
        <div
          className="relative z-10 flex flex-col-reverse lg:flex-row
                                items-center lg:items-center
                                justify-center
                                gap-6 lg:gap-8 xl:gap-40   
                                px-4 lg:px-12 py-10
                                mx-auto lg:max-w-[1280px] xl:max-w-[1440px]"
        >
          {/* Image (left) with centered overlay text */}
          <div
            className="relative hidden lg:block w-full lg:w-[640px] xl:w-[720px] 2xl:w-[840px]
                    h-[320px] sm:h-[480px] lg:h-[720px] xl:h-[857px] flex-shrink-0"
          >
            <Image
              src="/images/bg-front-page_2.png"
              alt="Login Illustration"
              fill
              priority
              className="object-cover rounded-[30px]"
              sizes="(min-width:1536px) 840px, (min-width:1280px) 720px, (min-width:1024px) 640px, 100vw"
            />
          </div>

          {/* Right column: heading, copy, button */}
          <div className="flex flex-col w-full lg:flex-1 max-w-full lg:max-w-[640px] lg:self-start mt-20">
            <h2 className="title-regsiter-login text-5xl text-center lg:text-left lg:text-[90px] mb-4 w-full flex justify-center lg:justify-start dark">
              Xhibit <br />
              Your Edge
            </h2>
            <p className="text-lg mb-20 mt-10 text-[24px] text-[#252525] dark:text-[#F5F5F5]/60 text-center pb-8 lg:text-left lg:pb-10">
              Build stunning <strong>UI/UX</strong> Designs with smart feedback
              and usability scores so you don&apos;t just showcase your work,
              you show you know UX.
            </p>
            <div className="mt-2 flex justify-center lg:justify-start">
              <Link
                href="/auth/login"
                className="w-[489px] h-[60px] flex-shrink-0 rounded-[10px] border-[3px]
                                border-[#ED5E20] text-[#ED5E20] font-[Poppins] text-[25px] leading-[40px] font-bold text-center
                                bg-transparent transition-colors duration-200
                                hover:bg-[#ED5E20] hover:text-white hover:border-[#FF8700]
                                focus-visible:ring-2 focus-visible:ring-[#FF8700]
                                cursor-pointer inline-flex items-center justify-center
                                dark:border-white dark:text-white
                                dark:hover:bg-[#171616] dark:hover:text-white dark:hover:border-white
                                dark:focus-visible:ring-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
