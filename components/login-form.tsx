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
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFigmaAuthUrl } from "@/lib/figma-auth";
import { useEffect, useState } from "react";
import { avatarStyles } from "@/constants/randomAvatars";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";


const formSchema = loginFormSchema;

function getRandomAvatar(userId: string) {
  const randomStyle =
    avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
  return `${randomStyle}${userId}`;
}


export default function LoginForm() {

  const [loginLoading, setLoginLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [figmaLoading, setFigmaLoading] = useState(false);


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
    setFigmaLoading(true);
    try {
      // Get the Figma auth URL
      const authUrl = await getFigmaAuthUrl();
      if (!authUrl) {
        toast.error("Failed to initialize Figma login");
        setFigmaLoading(false);
        return;
      }

      // Store current URL for redirect after auth
      if (typeof window !== 'undefined') {
        localStorage.setItem('preAuthPath', window.location.pathname);
      }
      // Redirect to Figma OAuth
      window.location.href = authUrl;
    } catch (error) {
      setFigmaLoading(false);
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
    setLoginLoading(true);

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

      // After successful login, ensure profile exists
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch the user's profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, avatar_url, first_name, middle_name, last_name, username, gender")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(`Profile Error: ${profileError.message}`);
        } else if (profile && (!profile.avatar_url || profile.avatar_url.trim() === "")) {
          // If avatar_url is missing or empty, generate and set a default avatar
          const avatarUrl = getRandomAvatar(user.id);

          // Compose names from user_metadata if missing
          const first_name = profile.first_name ?? user.user_metadata?.first_name ?? "";
          const middle_name = profile.middle_name ?? user.user_metadata?.middle_name ?? "";
          const last_name = profile.last_name ?? user.user_metadata?.last_name ?? "";

          const { error: upsertError } = await supabase.from("profiles").upsert({
            id: user.id,
            first_name,
            middle_name,
            last_name,
            username: profile.username ?? user.user_metadata?.username ?? "",
            gender: profile.gender ?? user.user_metadata?.gender ?? "",
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          });
          if (upsertError) {
            console.error("Profile upsert error: ", upsertError.message);
            toast.error(`Failed to save profile avatar. ${upsertError.message}`);
          }
        }
      }

      toast.success("Logged in successfully!");
      setLoginLoading(false);
      setRedirecting(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (error) {
      console.error("Form submission error", error);
      // toast.error('Failed to submit the form. Please try again.')
    } finally {
      setLoginLoading(false);
    }
  }

  const whiteCursor: React.CSSProperties = {
    cursor:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' stroke='%23ffffff' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3l7 17 2-7 7-2-16-8Z'/></svg>\") 2 2, pointer",
  };

  return (
    <>
      {/* Page Container with background video */}
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

        {/* Overlay for darkening background */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Centered Login Card */}
        <div className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md xl:max-w-lg p-6 sm:p-8 md:p-10 lg:p-12 
                        bg-[#1E1E1E]/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">

          {/* Centered Logo */}
          <div className="flex justify-center">
            <Image
              src="/images/dark-header-icon.png"
              alt="Uxhibit Logo"
              width={2280}   // original width
              height={899}   // original height
              className="w-auto h-16 sm:h-20 md:h-24 mb-5"
            />
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-center mb-10 text-white dark:text-[#F5F5F5]/70">
            Welcome Back, Please Log In to Continue
          </p>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
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
                        className="
                                  w-full h-12 
                                  sm:h-[45px] sm:text-sm 
                                  lg:h-[55px] lg:text-md 
                                  xl:h-[55px] xl:text-lg
                                  "
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
                                  xl:h-[55px] xl:text-lg
                                  input-colored 
                                  "
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
                disabled={loginLoading || redirecting}
                className={`group relative inline-flex items-center justify-center
                  w-full h-11 sm:h-12 mt-5
                  rounded-xl text-base tracking-wide
                  transition-all duration-300
                  text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                  hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                  active:scale-[.97]
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/4
                  ${loginLoading || redirecting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
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
                  {loginLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Logging in...
                    </>
                  ) : redirecting ? (
                    <>
                      <Loader2 size={20} className="animate-spin cursor-not-allowed" />
                      Redirecting...
                    </>
                  ) : (
                    "Log In"
                  )}
                </span>
              </Button>
            </form>
          </Form>
          {/* End of Login Form submission */}

          {/* Figma Login */}
          <Button
            type="button"
            onClick={handleFigmaLogin}
            disabled={figmaLoading}
            className={`group relative inline-flex items-center justify-center
              w-full h-11 sm:h-12 mt-2
              rounded-xl text-base tracking-wide
              transition-all duration-300
              text-white shadow-md
              hover:shadow-lg
              active:scale-[.97]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1E1E1E]/20
              bg-[#1E1E1E] dark:bg-[#2C2C2C]
              ${figmaLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
              `}
          >
            <span
              aria-hidden
              className="absolute inset-[2px] rounded-[10px] 
              bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]
              backdrop-blur-[2px]"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl ring-1 ring-white/10 group-hover:ring-white/20"
            />
            <span className="relative z-10 flex items-center gap-3">
              {figmaLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <Image
                    src="/images/figma-logo.png"
                    alt="Figma Logo"
                    width={20}
                    height={10}
                  />
                  Continue with Figma
                </>
              )}
            </span>
          </Button>

          {/* Links: Sign Up + Forgot Password */}
          <div className="mt-8 text-center text-xs sm:text-sm text-white font-light">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium"
            >
              Sign Up
            </Link>
            <div className="mt-2">
              <Link
                href="/auth/forgot-password"
                className="text-white hover:text-[#ED5E20] transition-colors duration-200"
              >
                Forgot Password
              </Link>
            </div>
          </div>
        </div>
        {/* End of Login Card */}
      </div>
      {/* End of Container */}
    </>
  );
}
