import UploadWithLink from "@/components/upload-file";
import Image from "next/image";

export default function Evaluate() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start px-4 pt-4 lg:pt-8 pb-8">
      <h1 className="text-3xl md:text-4xl font-semibold text-center mb-6">Upload a Design</h1>

      {/* Background image card */}
      <div className="relative w-full max-w-4xl md:max-w-5xl overflow-hidden rounded-2xl shadow-xl">
        {/* BG image */}
        <Image
          src="/images/gradient-evaluate.png"
          alt="Evaluate background"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1280px) 1024px, 100vw"
        />
        {/* Optional overlay for readability */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/30" aria-hidden />

        {/* Content on top */}
        <div className="relative z-10 p-8 md:p-14 lg:p-16 flex flex-col items-center justify-center gap-6">
          <div className="w-full max-w-2xl rounded-xl bg-white/80 dark:bg-black/60 backdrop-blur-md p-6 md:p-8 shadow-xl">
            <p
              className="text-[clamp(1.125rem,2.2vw,1.75rem)] leading-relaxed text-center
             text-neutral-900 dark:text-neutral-100 break-words
             drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] mb-10"
            >
              Paste your design&apos;s Figma link below.
            </p>
            <div className="mt-4">
              <UploadWithLink />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
