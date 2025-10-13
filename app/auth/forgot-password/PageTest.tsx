"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import Image from "next/image";
import { createClient } from '@supabase/supabase-js'; // Updated import
import Link from "next/link";
// import { redirect } from "next/dist/server/api-utils";
import { useRouter } from "next/navigation"; //
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [emailSentLoading, setEmailSentLoading] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    console.log(supabase);

    console.log("Requesting password reset for:", values.email);

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    setLoading(false);

    if (error) {
      console.error("Reset password error:", error.message);
      toast.error(error.message || "Failed to send reset email.");
    } else {
      console.log("Reset email sent successfully.");
      setEmailSentLoading(true);
      setTimeout(() => {
        router.push(`${process.env.NEXT_PUBLIC_APP_URL}/auth/email-sent`);
      }, 1500);
    }
  }

  if (emailSentLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/60">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-10 h-10 text-[#ED5E20]" />
          <p className="text-lg text-white">Sending email...</p>
        </div>
      </div>
    );
  }


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

      {/* Centered Reset Card */}
      <div className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg 
                      p-6 sm:p-8 md:p-10 bg-white/40 dark:bg-[#1E1E1E]/40 
                      backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">

        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/images/reset-password.svg"
            alt="Reset password illustration"
            width={150}
            height={150}
            className="object-contain mb-6"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#ED5E20] mb-4">
          Forgot Password
        </h2>

        {/* Subtitle */}
        <p className="mb-8 text-sm sm:text-base md:text-lg text-center text-white">
          Enter your email to get a reset link.
        </p>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Input with validation */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      id="email"
                      placeholder="Enter your email"
                      type="email"
                      autoComplete="email"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Send Email Button */}
            <Button
              type="submit"
              disabled={loading}
              className={`group relative inline-flex items-center justify-center
                          w-full h-11 sm:h-12 rounded-xl text-base tracking-wide
                          transition-all duration-300 cursor-pointer
                          text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                          hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                          active:scale-[.97] focus:outline-none
                          focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                          disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <span aria-hidden className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]" />
              <span aria-hidden className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px]" />
              <span aria-hidden className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl">
                <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
              </span>
              <span aria-hidden className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading && (
                  <Loader2 className="animate-spin w-5 h-5" />
                )}
                {loading ? "Sending..." : "Send Email"}
              </span>
            </Button>

            {/* Back to Login */}
            <div className="mt-5 text-center text-sm text-[#1E1E1E]/60 dark:text-[#F5F5F5]/40">
              <Link
                href="/auth/login"
                className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium"
              >
                Back to Log In
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}