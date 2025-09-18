"use client";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { PasswordInput } from "@/components/ui/password-input";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(window.location.search)
        .then(({ data: codeData, error }) => {
          console.error("Code User",codeData.user);
          console.error("Code Session",codeData.session);
          if (error) {
            console.error("Error", error.message);
            toast.error("Invalid or expired reset link.");
            router.replace("/auth/forgot-password");
          }
        });
    }
  }, [searchParams, router]);
  
  const form = useForm<{
    password: string,
    confirmPassword: string
  }>({
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (!error) {
      window.location.href = "/auth/reset-password-success";
    } else {
      toast.error("There was an error updating your password.");
    }
  };


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
      <div
        className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md xl:max-w-lg 
                   p-6 sm:p-8 md:p-10 lg:p-12 bg-white/40 dark:bg-[#1E1E1E]/40 
                   backdrop-blur-xl rounded-2xl shadow-xl border border-white/20"
      >
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
          Set New Password
        </h2>

        {/* Subtitle */}
        <p className="mb-8 text-sm sm:text-base md:text-lg text-center text-[#1E1E1E]/70 dark:text-[#F5F5F5]/70">
          Enter your new password below to reset your account.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="grid gap-2 mb-2">
                  <FormControl>
                    <PasswordInput
                      id="password"
                      placeholder="Enter new password"
                      type="password"
                      autoComplete="new-password"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="grid gap-2 mb-6">
                  <FormControl>
                    <PasswordInput
                      id="confirmPassword"
                      placeholder="Re-enter new password"
                      type="password"
                      autoComplete="new-password"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Button */}
            <Button
              type="submit"
              className={`group relative inline-flex items-center justify-center
                          w-full h-11 sm:h-12 rounded-xl text-base tracking-wide
                          transition-all duration-300 cursor-pointer
                          text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                          hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                          active:scale-[.97] focus:outline-none
                          focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40`}
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
              />
              <span
                aria-hidden
                className="absolute inset-[2px] rounded-[10px] 
                          bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] 
                          backdrop-blur-[2px]"
              />
              <span
                aria-hidden
                className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
              >
                <span
                  className="absolute inset-y-0 -left-full w-1/2 
                            bg-gradient-to-r from-transparent via-white/50 to-transparent 
                            opacity-0 transition-all duration-700 
                            group-hover:translate-x-[220%] group-hover:opacity-70"
                />
              </span>
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
              />
              <span className="relative z-10">Set New Password</span>
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