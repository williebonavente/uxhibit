"use client";

import Link from "next/link";
import { email, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { registerFormSchema } from "@/lib/validation-schemas";
import MiddleHeaderIcon from "./middle-header-icon";
import Image from "next/image";
import { type User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
// import { Avatar } from '@radix-ui/react-avatar'

export default function RegistrationForm({ user }: { user: User | null }) {

  const router = useRouter();

  const form = useForm<z.infer<typeof registerFormSchema>>({
    defaultValues: {
      username: "",
      full_name: "",
      age: "",
      gender: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(registerFormSchema),
  });

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";

  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    const supabase = createClient();

    try {

      const res = await fetch("/api/check_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      console.log("Raw response:", res);
      const emailCheck = await res.json();
      console.log(emailCheck)
      if (emailCheck.exists) {
        toast.error("This email is already registered.");
        return;
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${origin}/auth/confirm?next=/auth/login`,
          data: {
            username: values.username,
            full_name: values.full_name,
            age: values.age,
            gender: values.gender,

          },
        },
      });
      console.log('signUp response', { signUpData, error });

      if (error) {
        toast.error(error.message ?? "Registration failed");
        console.log("Sign-up error details:", error);
        return;
      }

      toast.success('Check your email to confirm your account');
      router.push('/auth/login');
    } catch (e) {
      console.error('Unexpected registration error', e);
      toast.error(`Failed to submit the form. Please try again.${e}`);
    }
  }

  return (
    <>
      {/* Page Container with background video */}
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

        {/* Overlay for darkening background */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Centered Registration Card */}
        <div className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg xl:max-w-xl p-6 sm:p-8 md:p-10 lg:p-12 
                        bg-white/40 dark:bg-[#1E1E1E]/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">

          {/* Centered Logo */}
          <div className="flex justify-center mb-5">
            <Image
              src="/images/dark-header-icon.png"
              alt="Uxhibit Logo"
              width={2280}
              height={899}
              className="w-auto h-16 sm:h-20 md:h-24"
            />
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-center mb-8 text-[#1E1E1E]/70 dark:text-[#F5F5F5]/70">
            Create your account and start designing with Uxhibit
          </p>

          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {[
                { name: "username", placeholder: "Username" },
                { name: "full_name", placeholder: "Full Name" },
                { name: "email", placeholder: "Email", type: "email" },
                { name: "age", placeholder: "Age", type: "number" },
                { name: "gender", placeholder: "Gender" },
                { name: "password", placeholder: "Password", password: true },
                {
                  name: "confirmPassword",
                  placeholder: "Confirm Password",
                  password: true,
                },
              ].map((fieldConfig, idx) => (
                <FormField
                  key={idx}
                  control={form.control}
                  name={fieldConfig.name as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        {fieldConfig.password ? (
                          <PasswordInput
                            id={fieldConfig.name}
                            placeholder={fieldConfig.placeholder}
                            type="password"
                            className="w-full h-11 sm:h-12 text-sm sm:text-base"
                            {...field}
                          />
                        ) : (
                          <Input
                            id={fieldConfig.name}
                            placeholder={fieldConfig.placeholder}
                            type={fieldConfig.type || "text"}
                            className="w-full h-11 sm:h-12 text-sm sm:text-base"
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Register Button */}
              <Button
                type="submit"
                className="group relative inline-flex items-center justify-center
                          w-full h-11 sm:h-12 rounded-xl text-base tracking-wide
                          transition-all duration-300 cursor-pointer
                          text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                          hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                          active:scale-[.97] focus:outline-none
                          focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40"
              >
                <span aria-hidden className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]" />
                <span aria-hidden className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px]" />
                <span aria-hidden className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl">
                  <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                </span>
                <span aria-hidden className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50" />
                <span className="relative z-10">Sign Up</span>
              </Button>
            </form>
          </Form>

          {/* Link to Login */}
          <div className="mt-6 text-center text-xs sm:text-sm text-[#1E1E1E]/60 dark:text-[#F5F5F5]/40">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
