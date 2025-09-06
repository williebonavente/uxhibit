"use client";

import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { login } from "@/app/auth/login/action";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  // FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginFormSchema } from "@/lib/validation-schemas";
import MiddleHeaderIcon from "./middle-header-icon";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFigmaAuthUrl } from "@/lib/figma-auth";
import { useEffect } from "react";

const formSchema = loginFormSchema;

export default function LoginForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

async function handleFigmaLogin(e: React.MouseEvent) {
  e.preventDefault();
  try {
    // Get the Figma auth URL
    const authUrl = await getFigmaAuthUrl();
    if (!authUrl) {
      toast.error("Failed to initialize Figma login");
      return;
    }

    // Store current URL for redirect after auth
    if (typeof window !== 'undefined') {
      localStorage.setItem('preAuthPath', window.location.pathname);
    }

    // Redirect to Figma OAuth
    window.location.href = authUrl;
  } catch (error) {
    console.error('Figma login error:', error);
    toast.error("Failed to start Figma authentication");
  }
}


  useEffect(() => {
    // Check for auth errors
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')

    if (error === 'invalid_callback') {
      toast.error("Invalid authentication callback");
    } else if (error === 'auth_failed') {
      toast.error("Figma authentication failed.")
    }
  }, [])
  async function onSubmit(values: z.infer<typeof formSchema>) {

    try {
      // Convert values to FormData for the Supabase action
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      const result = await login(formData);
      if (result?.error) {
        toast.error(
          result.error === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : result.error === "User not found"
              ? "No account found with this email."
              : result.error === "Email not confirmed"
                ? "Please Confirm Your Email!"
                : result.error
        );
        return;
      }
      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Form submission error", error);
      // toast.error('Failed to submit the form. Please try again.')
    }
  }

  return (
    <>
      {/* Top Middle Icon */}
      <MiddleHeaderIcon href="/" />

      {/* Container uniform with registration */}
      <div className="flex flex-col lg:flex-row min-h-screen w-full justify-center items-center px-4 py-8 lg:px-20 lg:py-12">
        {/* Left Side → Video Background */}
        <div className="hidden 2xl:block relative mr-[116px] w-full 2xl:w-[640px] 2xl:h-[857px] flex-shrink-0 rounded-xl overflow-hidden">
          {/* Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="object-cover w-full h-full rounded-4xl"
          >
            <source src="/images/uxhibit-gif-3(webm).webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>

          {/* Overlay Text on Video */}
          <span
            className="absolute inset-0 flex items-center justify-center 
                      text-white z-10 mb-150 leading-tight 
                      text-2xl sm:text-3xl lg:text-3xl xl:text-5xl font-medium"
          >
            Welcome back! <br /> Xhibit your greatness.
          </span>
        </div>
        {/* End of Left Side */}

        {/* Right Side → Login Form */}
        <div className="flex flex-col w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-lg self-center">
          {/* Title */}
          <h2
            className="title-regsiter-login text-4xl sm:text-5xl lg:text-[60px] 
                         text-center lg:text-left mb-4"
          >
            Log In
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-[24px] mb-4 text-[#1E1E1E]/50 dark:text-[#F5F5F5]/60 text-center lg:text-left lg:pb-6">
            Welcome back — Xhibit your edge!
          </p>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        id="email"
                        placeholder="Email"
                        type="email"
                        autoComplete="email"
                        className="w-full h-12 
                                  sm:h-[45px] sm:text-sm 
                                  lg:h-[55px] lg:text-md 
                                  xl:h-[55px] xl:text-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PasswordInput
                        id="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        className="w-full h-12 
                                  sm:h-[45px] sm:text-sm 
                                  lg:h-[55px] lg:text-md 
                                  xl:h-[55px] xl:text-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Login Button */}
              <Button
                type="submit"
                className={`
                  group relative inline-flex items-center justify-center
                  w-full h-12 lg:w-[513px] lg:h-[62px]
                  rounded-xl text-lg font-semibold tracking-wide
                  transition-all duration-300 cursor-pointer
                  text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                  hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                  active:scale-[.97]
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                `}
              >
                {/* Glow / gradient base */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                />

                {/* Inner glass layer */}
                <span
                  aria-hidden
                  className="absolute inset-[2px] rounded-[10px] 
                            bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))]
                            backdrop-blur-[2px]"
                />

                {/* Animated sheen */}
                <span
                  aria-hidden
                  className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                >
                  <span
                    className="absolute inset-y-0 -left-full w-1/2 translate-x-0 
                                  bg-gradient-to-r from-transparent via-white/50 to-transparent
                                  opacity-0 transition-all duration-700
                                  group-hover:translate-x-[220%] group-hover:opacity-70"
                  />
                </span>

                {/* Border ring */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
                />

                {/* Label */}
                <span className="relative z-10 flex items-center gap-2">
                  Log In
                </span>
              </Button>
            </form>
          </Form>
          {/* End of Login Form submission */}
          <Button
            type='button'
            onClick={handleFigmaLogin}
            className={` group relative inline-flex items-center justify-center
                        w-full h-12 lg:w-[513px] lg:h-[62px] mt-5
                        rounded-xl text-lg font-semibold tracking-wide
                        transition-all duration-300 cursor-pointer
                        text-white shadow-md
                        hover:shadow-lg
                        active:scale-[.97]
                        focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1E1E1E]/20
                        bg-[#1E1E1E] dark:bg-[#2C2C2C]`}
          >
            {/* Inner glass layer */}
            <span
              aria-hidden
              className="absolute inset-[2px] rounded-[10px] 
                            bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]
                            backdrop-blur-[2px]"
            />

            {/* Border ring */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl ring-1 ring-white/10 group-hover:ring-white/20"
            />

            {/* Label with Figma Logo */}
            <span className="relative z-10 flex items-center gap-3">
              <Image
                src="/images/figma-logo.png"
                alt="Figma Logo"
                width={40}
                height={20}
              />
              Continue with Figma
            </span>
          </Button>

          {/* Links: Sign Up + Forgot Password */}
          <div className="mt-8 text-center text-sm sm:text-base text-[#1E1E1E]/60 dark:text-[#F5F5F5]/40">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium"
            >
              Sign Up
            </Link>
            <div className="mt-4">
              <Link
                href="/auth/forgot-password"
                className="text-[#1E1E1E]/60 dark:text-[#F5F5F5]/40 hover:text-[#ED5E20] transition-colors duration-200 hover:underline"
              >
                Forgot Password
              </Link>
            </div>
          </div>
        </div>
        {/* End of Right Side */}
      </div>
      {/* End of Container */}
    </>
  );
}
