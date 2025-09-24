import Image from "next/image";
import Link from "next/link";


export default function EmailSentPage() {
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

      {/* Centered Confirmation Card */}
      <div className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg 
                      p-6 sm:p-8 md:p-10 bg-white/40 dark:bg-[#1E1E1E]/40 
                      backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 text-center">

        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/images/email-sent.svg"
            alt="Email sent illustration"
            width={150}
            height={150}
            className="object-contain mb-6"
          />
        </div>

        {/* Title */}
        <h2 className="gradient-text text-2xl sm:text-3xl font-bold text-center mb-4">
          Email Sent
        </h2>

        {/* Message */}
        <p className="mb-8 text-sm sm:text-base md:text-lg text-[#1E1E1E]/70 dark:text-[#F5F5F5]/70">
          We&rsquo;ve sent you a link to reset your password. Please check your email.
        </p>
        {/* Back to Login */}
        <Link
          href="/auth/login"
          className="inline-block text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium"
        >
          Back to Log In
        </Link>
      </div>
    </div>
  );
}