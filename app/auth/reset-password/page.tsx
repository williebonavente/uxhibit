import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
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
      
      {/* Centered Reset Password Card */}
      <div className="relative z-10 w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}