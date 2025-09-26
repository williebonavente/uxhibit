import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {

  const whiteCursor: React.CSSProperties = {
    cursor:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' stroke='%23ffffff' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3l7 17 2-7 7-2-16-8Z'/></svg>\") 2 2, pointer",
  };

  return (
    <div 
      style={whiteCursor}
      className="relative min-h-screen flex items-center justify-center w-full overflow-hidden p-5"
    >
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

      {/* Centered Reset Password Card */}
      <div className="relative z-10 w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}